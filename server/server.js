import express, { json } from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccountKey from "./blog-website-kanish-firebase-adminsdk-ru7wg-389fd6b277.json" assert { type: "json" };
import { getAuth } from "firebase-admin/auth";
import User from "./Schema/User.js";
import Blog from "./Schema/Blog.js";
import aws from "aws-sdk";

const server = express();
let PORT = 3000;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
});

// Email and password validation regex
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

// Middleware to parse JSON requests
server.use(express.json());
server.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true,
});

// Setting up AWS s3 bucket
const s3 = new aws.S3({
    region: "eu-north-1",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Generate URL for image
const generateUploadURL = async () => {
    const date = new Date();
    const imageName = `${nanoid()}-${date.getTime()}.jpeg`;

    return await s3.getSignedUrlPromise("putObject", {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageName,
        Expires: 1000,
        ContentType: "image/jpeg",
    });
};

// Middleware function to verify the JSON Web Token (JWT) in the request header.
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Access Token in invalid" });
        }

        req.user = user.id;
        next();
    });
};

// Format user data and generate access token
const formatDatatoSend = (user) => {
    const access_token = jwt.sign(
        { id: user._id },
        process.env.SECRET_ACCESS_KEY
    );
    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
    };
};

// Generate a unique username based on email
const generateUsername = async (email) => {
    let username = email.split("@")[0];
    let usernameExists = await User.exists({
        "personal_info.username": username,
    });
    if (usernameExists) {
        username += nanoid().substring(0, 5);
    }
    return username;
};

// Upload image URL route
server.get("/get-upload-url", (req, res) => {
    generateUploadURL()
        .then((url) => {
            res.status(200).json({ uploadURL: url });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ message: "Error generating upload URL" });
        });
});

// Signup endpoint
server.post("/signup", (req, res) => {
    let { fullname, email, password } = req.body;

    if (fullname.length < 3) {
        return res
            .status(403)
            .json({ error: "Full name must be at least 3 letters long" });
    }

    if (!email.length || !emailRegex.test(email)) {
        return res.status(403).json({ error: "Invalid email" });
    }

    if (!passwordRegex.test(password)) {
        return res.status(403).json({
            error: "Password must be 6-20 characters long and include a number, uppercase, and lowercase letter",
        });
    }

    bcrypt.hash(password, 10, async (err, hashed_password) => {
        if (err) {
            return res.status(500).json({ error: "Error hashing password" });
        }

        try {
            let username = await generateUsername(email);
            let user = new User({
                personal_info: {
                    fullname,
                    email,
                    password: hashed_password,
                    username,
                },
            });

            let savedUser = await user.save();
            return res.status(200).json(formatDatatoSend(savedUser));
        } catch (error) {
            if (error.code === 11000) {
                return res.status(403).json({ error: "Email already exists" });
            }
            return res.status(500).json({ error: error.message });
        }
    });
});

// Signin endpoint
server.post("/signin", (req, res) => {
    let { email, password } = req.body;

    User.findOne({ "personal_info.email": email })
        .then((user) => {
            if (!user) {
                return res.status(404).json({ error: "Email not found" });
            }

            if (!user.google_auth) {
                bcrypt.compare(
                    password,
                    user.personal_info.password,
                    (err, result) => {
                        if (err) {
                            return res
                                .status(403)
                                .json({ error: "Error logging in" });
                        }

                        if (!result) {
                            return res
                                .status(403)
                                .json({ error: "Invalid password" });
                        }
                        return res.status(200).json(formatDatatoSend(user));
                    }
                );
            } else {
                return res.status(403).json({
                    error: "Account is created with google, Try logging with Google",
                });
            }
        })
        .catch((err) => {
            return res.status(500).json({ error: err.message });
        });
});

// Google authentication endpoint
server.post("/google-auth", async (req, res) => {
    let { access_token } = req.body;

    getAuth()
        .verifyIdToken(access_token)
        .then(async (decodedUser) => {
            let { email, name, picture } = decodedUser;
            picture = picture.replace("s96-c", "s384-c");

            let user = await User.findOne({ "personal_info.email": email })
                .select(
                    "personal_info.fullname personal_info.username personal_info.profile_img google_auth"
                )
                .then((u) => u || null)
                .catch((err) => res.status(500).json({ error: err.message }));

            if (user) {
                if (!user.google_auth) {
                    return res
                        .status(403)
                        .json({ error: "Account not created with Google" });
                }
            } else {
                let username = await generateUsername(email);
                user = new User({
                    personal_info: { fullname: name, email, username },
                    google_auth: true,
                });

                await user
                    .save()
                    .then((u) => (user = u))
                    .catch((err) =>
                        res.status(500).json({ error: err.message })
                    );
            }

            return res.status(200).json(formatDatatoSend(user));
        })
        .catch(() =>
            res
                .status(500)
                .json({ error: "Failed to authenticate with Google" })
        );
});

// Endpoint to fetch the latest published blogs
server.post("/latest-blogs", (req, res) => {
    let { page } = req.body;
    let maxLimit = 5;

    Blog.find({ draft: false })
        .populate(
            "author",
            "personal_info.profile_img personal_info.username personal_info.fullname -_id"
        )
        .sort({ publishedAt: -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then((blogs) => {
            res.status(200).json({ blogs });
        })
        .catch((err) => {
            res.status(500).json({ error: err.message });
        });
});

server.post("/all-latest-blogs-count", (req, res) => {
    Blog.countDocuments({ draft: false })
        .then((count) => {
            res.status(200).json({ totalDocs: count });
        })
        .catch((err) => {
            res.status(500).json({ error: err.message });
        });
});

// Endpoint to fetch the trending blogs
server.get("/trending-blogs", (req, res) => {
    Blog.find({ draft: false })
        .populate(
            "author",
            "personal_info.profile_img personal_info.username personal_info.fullname -_id"
        )
        .sort({
            "activity.total_reads": -1,
            "activity.total_likes": -1,
            publishedAt: -1,
        })
        .select("blog_id title publishedAt -_id")
        .limit(5)
        .then((blogs) => {
            res.status(200).json({ blogs });
        })
        .catch((err) => {
            res.status(500).json({ error: err.message });
        });
});

// Endpoint to fetch the searched blogs
server.post("/search-blogs", (req, res) => {
    let { tag, page } = req.body;
    let findQuery = { tags: { $regex: new RegExp(tag, "i") }, draft: false };
    let maxLimit = 5;

    Blog.find(findQuery)
        .populate(
            "author",
            "personal_info.profile_img personal_info.username personal_info.fullname -_id"
        )
        .sort({ publishedAt: -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then((blogs) => {
            res.status(200).json({ blogs });
        })
        .catch((err) => {
            res.status(500).json({ error: err.message });
        });
});

server.post("/search-blogs-count", (req, res) => {
    let { tag } = req.body;
    let findQuery = { tags: { $regex: new RegExp(tag, "i") }, draft: false };

    Blog.countDocuments(findQuery)
        .then((count) => {
            return res.status(200).json({ totalDocs: count });
        })
        .catch((err) => {
            return res.status(500).json({ error: err.message });
        });
});

// Endpoint to create a blog post with JWT authentication and validation.
server.post("/create-blog", verifyJWT, (req, res) => {
    let authorId = req.user;
    let { title, des, banner, tags, content, draft } = req.body;

    if (!title.length) {
        return res.status(403).json({ error: "Title is required" });
    }

    if (!draft) {
        if (!des.length || des.length > 200) {
            return res.status(403).json({
                error: "Description is required and should be less than 200 characters",
            });
        }

        if (!banner.length) {
            return res.status(403).json({ error: "Banner is required" });
        }

        if (!content || !content.blocks || !content.blocks.length) {
            return res.status(403).json({ error: "Content is required" });
        }

        if (!tags || !tags.length || tags.length > 10) {
            return res.status(403).json({
                error: "Tags are required and should be less than 10",
            });
        }
    }

    tags = tags.map((tag) => tag.toLowerCase());

    let blog_id =
        title
            .replace(/[^a-zA-Z0-9]/g, " ")
            .replace(/\s+/g, "-")
            .trim() + nanoid();

    let blog = new Blog({
        title,
        des,
        banner,
        content,
        tags,
        author: authorId,
        blog_id,
        draft: Boolean(draft),
    });
    blog.save()
        .then((blog) => {
            let incrementVal = draft ? 0 : 1;
            User.findOneAndUpdate(
                { _id: authorId },
                {
                    $inc: { "account_info.total_posts": incrementVal },
                    $push: { blogs: blog._id },
                }
            )
                .then((user) => {
                    return res.status(200).json({ id: blog.blog_id });
                })
                .catch((err) => {
                    return res
                        .status(500)
                        .json({ error: "Failed to update total posts number" });
                });
        })
        .catch((err) => {
            return res.status(500).json({ error: err.message });
        });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
