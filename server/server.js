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
import Notification from "./Schema/Notification.js";
import Comment from "./Schema/Comment.js";
import { populate } from "dotenv";

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

// Endpoint to change-password
server.post("/change-password", verifyJWT, (req, res) => {
    let { currentPassword, newPassword } = req.body;

    if (!currentPassword.length || !newPassword.length) {
        return toast.error("Fill all the inputs");
    }

    if (
        !passwordRegex.test(currentPassword) ||
        !passwordRegex.test(newPassword)
    ) {
        return res.status(403).json({
            error: "Password must be 6-20 characters long and include a number, uppercase, and lowercase letter",
        });
    }

    if (currentPassword == newPassword) {
        return res.status(403).json({
            error: "New password is the same as the current password",
        });
    }

    User.findOne({ _id: req.user })
        .then((user) => {
            if (user.google_auth) {
                return res.status(403).json({
                    error: "You can't change account password because you logged in with google",
                });
            }

            bcrypt.compare(
                currentPassword,
                user.personal_info.password,
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    if (!result) {
                        return res
                            .status(403)
                            .json({ error: "Current password is incorrect" });
                    }
                    bcrypt.hash(newPassword, 10, (err, hashed_password) => {
                        User.findOneAndUpdate(
                            { _id: req.user },
                            { "personal_info.password": hashed_password }
                        )
                            .then((u) => {
                                return res.status(200).json({
                                    status: "Password changed successfully",
                                });
                            })
                            .catch((err) => {
                                return res
                                    .status(500)
                                    .json({ error: err.message });
                            });
                    });
                }
            );
        })
        .catch((err) => {
            return res.status(500).json({ error: err.message });
        });
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
    let { tag, query, author, page, limit, eliminate_blog } = req.body;
    let findQuery;
    if (tag) {
        findQuery = {
            tags: new RegExp(tag, "i"),
            draft: false,
            blog_id: { $ne: eliminate_blog },
        };
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, "i") };
    } else if (author) {
        findQuery = { author, draft: false };
    }

    let maxLimit = limit ? limit : 2;

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

// Endpoint to get the count of search blogs
server.post("/search-blogs-count", (req, res) => {
    let { tag, author, query } = req.body;
    let findQuery;
    if (tag) {
        findQuery = { tags: new RegExp(tag, "i"), draft: false };
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, "i") };
    } else if (author) {
        findQuery = { author, draft: false };
    }

    Blog.countDocuments(findQuery)
        .then((count) => {
            return res.status(200).json({ totalDocs: count });
        })
        .catch((err) => {
            return res.status(500).json({ error: err.message });
        });
});

// Endpoint to search for users
server.post("/search-users", (req, res) => {
    let { query } = req.body;

    User.find({ "personal_info.username": new RegExp(query, "i") })
        .limit(50)
        .select(
            "personal_info.fullname personal_info.username personal_info.profile_img -_id"
        )
        .then((users) => {
            res.status(200).json({ users });
        })
        .catch((err) => {
            res.status(500).json({ error: err.message });
        });
});

// Endpoint to get a user's profile information
server.post("/get-profile", (req, res) => {
    let { username } = req.body;

    User.findOne({ "personal_info.username": username })
        .select("-personal_info.password -google_auth -blogs -updatedAt")
        .then((user) => {
            res.status(200).json(user);
        })
        .catch((err) => {
            res.status(500).json({ error: err.message });
        });
});

// Endpoint to create a blog post with JWT authentication and validation.
server.post("/create-blog", verifyJWT, (req, res) => {
    let authorId = req.user;
    let { title, des, banner, tags, content, draft, id } = req.body;

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
        id ||
        title
            .replace(/[^a-zA-Z0-9]/g, " ")
            .replace(/\s+/g, "-")
            .trim() + nanoid();

    if (id) {
        Blog.findOneAndUpdate(
            { blog_id },
            { title, des, banner, content, tags, draft: Boolean(draft) }
        )
            .then(() => {
                return res.status(200).json({ id: blog_id });
            })
            .catch((err) => {
                return res
                    .status(500)
                    .json({ error: "Failed to update total post number" });
            });
    } else {
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
                        return res.status(500).json({
                            error: "Failed to update total posts number",
                        });
                    });
            })
            .catch((err) => {
                return res.status(500).json({ error: err.message });
            });
    }
});

// Endpoint to get a blog post
server.post("/get-blog", (req, res) => {
    let { blog_id, draft, mode } = req.body;
    let incrementVal = mode != "edit" ? 1 : 0;

    Blog.findOneAndUpdate(
        { blog_id },
        { $inc: { "activity.total_reads": incrementVal } }
    )
        .populate(
            "author",
            "personal_info.fullname personal_info.username personal_info.profile_img"
        )
        .select("title des content banner activity publishedAt blog_id tags")
        .then((blog) => {
            User.findOneAndUpdate(
                {
                    "personal_info.username":
                        blog.author.personal_info.username,
                },
                { $inc: { "account_info.total_reads": incrementVal } }
            ).catch((err) => {
                return res.status(500).json({ error: err.message });
            });
            if (blog.draft && !draft) {
                return res
                    .status(500)
                    .json({ err: "You cannot access a draft blog" });
            }
            return res.status(200).json({ blog });
        })
        .catch((err) => {
            return res.status(500).json({ error: err.message });
        });
});

// Endpoint to like a blog post
server.post("/like-blog", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id, isLikedByUser } = req.body;

    let incrementVal = isLikedByUser ? -1 : 1;

    Blog.findOneAndUpdate(
        { _id },
        { $inc: { "activity.total_likes": incrementVal } }
    ).then((blog) => {
        if (!isLikedByUser) {
            let like = new Notification({
                type: "like",
                blog: _id,
                notification_for: blog.author,
                user: user_id,
            });
            like.save()
                .then((notification) => {
                    return res.status(200).json({ liked_by_user: true });
                })
                .catch((err) => {
                    return res.status(500).json({ error: err.message });
                });
        } else {
            Notification.findOneAndDelete({
                user: user_id,
                blog: _id,
                type: "like",
            })
                .then((data) => {
                    return res.status(200).json({ liked_by_user: false });
                })
                .catch((err) => {
                    return res.status(500).json({ error: err.message });
                });
        }
    });
});

// Endpoint to check if a blog is liked by a user
server.post("/isliked-by-user", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id } = req.body;

    Notification.exists({ user: user_id, type: "like", blog: _id })
        .then((result) => {
            return res.status(200).json({ result });
        })
        .catch((err) => {
            return res.status(500).json({ error: err.message });
        });
});

server.post("/add-comment", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id, comment, blog_author, replying_to } = req.body;

    if (!comment.length) {
        return res.status(403).json({ error: "Write something to comment" });
    }

    let commentObj = {
        blog_id: _id,
        blog_author,
        comment,
        commented_by: user_id,
    };

    if (replying_to) {
        commentObj.parent = replying_to;
        commentObj.isReply = true;
    }

    new Comment(commentObj).save().then(async (commentFile) => {
        let { comment, commentedAt, children } = commentFile;

        Blog.findOneAndUpdate(
            { _id },
            {
                $push: { comments: commentFile._id },
                $inc: {
                    "activity.total_comments": 1,
                    "activity.total_parent_comments": replying_to ? 0 : 1,
                },
            }
        ).then((blog) => {
            console.log("New comment created");
        });

        let notificationObj = {
            type: replying_to ? "reply" : "comment",
            blog: _id,
            notification_for: blog_author,
            user: user_id,
            comment: commentFile._id,
        };

        new Notification(notificationObj).save().then((notification) => {
            console.log("Comment notification created");
        });

        if (replying_to) {
            notificationObj.replied_on_comment = replying_to;

            await Comment.findOneAndUpdate(
                { _id: replying_to },
                { $push: { children: commentFile._id } }
            ).then((replyingToCommentDoc) => {
                notificationObj.notification_for =
                    replyingToCommentDoc.commented_by;
            });
        }

        return res.status(200).json({
            comment,
            commentedAt,
            _id: commentFile._id,
            children,
            user_id,
        });
    });
});

// Endpoint to fetch comments
server.post("/get-blog-comments", (req, res) => {
    let { blog_id, skip } = req.body;
    let maxLimit = 5;

    Comment.find({ blog_id, isReply: false })
        .populate(
            "commented_by",
            "personal_info.username personal_info.profile_img personal_info.fullname"
        )
        .skip(skip)
        .limit(maxLimit)
        .sort({ commentedAt: -1 })
        .then((comments) => {
            res.status(200).json(comments);
        })
        .catch((err) => {
            console.log(err.message);
            res.status(500).json({ error: err.message });
        });
});

// Endpoint to fetch replies
server.post("/get-replies", (req, res) => {
    let { _id, skip } = req.body;

    let maxLimit = 5;

    Comment.findOne({ _id })
        .populate({
            path: "children",
            options: {
                limit: maxLimit,
                skip: skip,
                sort: { commentedAt: -1 },
            },
            populate: {
                path: "commented_by",
                select: "personal_info.username personal_info.profile_img personal_info.fullname",
            },
            select: "-blog_id -updatedAt",
        })
        .select("children")
        .then((doc) => {
            res.status(200).json({ replies: doc.children });
        })
        .catch((err) => {
            console.log(err.message);
        });
});

const deleteComments = (_id) => {
    Comment.findOneAndDelete({ _id })
        .then((comment) => {
            if (comment.parent) {
                Comment.findOneAndUpdate(
                    { _id: comment.parent },
                    { $pull: { children: _id } }
                )
                    .then((data) => {
                        console.log("Comment deleted from parent");
                    })
                    .catch((err) => {
                        console.log(err.message);
                    });
            }

            Notification.findOneAndDelete({ comment: _id }).then(
                (notification) => {
                    console.log("Comment notification deleted");
                }
            );

            Notification.findOneAndDelete({ reply: _id }).then(
                (notification) => {
                    console.log("Reply notification deleted");
                }
            );

            Blog.findOneAndUpdate(
                { _id: comment.blog_id },
                {
                    $pull: { comments: _id },
                    $inc: { "activity.total_comments": -1 },
                    "activity.total_parent_comments": comment.parent ? 0 : -1,
                }
            )
                .then((blog) => {
                    if (comment.children.length) {
                        comment.children.map((replies) => {
                            deleteComments(replies);
                        });
                    }
                })
                .catch((err) => {
                    console.log(err.message);
                });
        })
        .catch((err) => {
            console.log(err.message);
        });
};

// Delete comment
server.post("/delete-comment", verifyJWT, (req, res) => {
    let user_id = req.user;
    let { _id } = req.body;

    Comment.findOne({ _id }).then((comment) => {
        if (user_id == comment.commented_by || user_id == comment.blog_author) {
            deleteComments(_id);
            return res.status(200).json({ status: "done" });
        } else {
            res.status(401).json({
                error: "You cannot delete this comment.",
            });
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
