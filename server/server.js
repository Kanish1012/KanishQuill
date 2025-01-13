import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";

// Import User schema
import User from "./Schema/User.js";

const server = express();
let PORT = 3000;

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

// Format user data and generate access token
const formatDatatoSend = (user) => {
    const access_token = jwt.sign(
        { id: user._id },
        process.env.SECRET_ACCESS_KEY
    );

    return {
        access_token, // Authentication token
        profile_img: user.personal_info.profile_img, // User's profile image
        username: user.personal_info.username, // Unique username
        fullname: user.personal_info.fullname, // Full name
    };
};

// Generate a unique username based on email
const generateUsername = async (email) => {
    let username = email.split("@")[0]; // Default username is the email prefix

    // Check if username already exists in the database
    let usernameExists = await User.exists({
        "personal_info.username": username,
    });

    // Append a unique string if username exists
    if (usernameExists) {
        username += nanoid().substring(0, 5);
    }

    return username;
};

// Signup endpoint
server.post("/signup", (req, res) => {
    let { fullname, email, password } = req.body;

    // Validate full name
    if (fullname.length < 3) {
        return res.status(403).json({
            error: "Full name must be at least 3 letters long",
        });
    }

    // Validate email
    if (!email.length) {
        return res.status(403).json({ error: "Enter email" });
    }
    if (!emailRegex.test(email)) {
        return res.status(403).json({ error: "Invalid email" });
    }

    // Validate password
    if (!passwordRegex.test(password)) {
        return res.status(403).json({
            error: "Password must be 6-20 characters long and include a number, uppercase, and lowercase letter",
        });
    }

    // Hash the password and save the user to the database
    bcrypt.hash(password, 10, async (err, hashed_password) => {
        if (err) {
            return res.status(500).json({ error: "Error hashing password" });
        }

        try {
            let username = await generateUsername(email); // Generate a unique username

            // Create a new user document
            let user = new User({
                personal_info: {
                    fullname,
                    email,
                    password: hashed_password,
                    username,
                },
            });

            // Save the user and send response
            let savedUser = await user.save();
            return res.status(200).json(formatDatatoSend(savedUser));
        } catch (error) {
            // Handle duplicate email error
            if (error.code === 11000) {
                return res.status(403).json({ error: "Email already exists" });
            }
            return res.status(500).json({ error: error.message });
        }
    });
});

// Signin endpoint
server.post("/signin", (req, res) => {
    let { email, password } = req.body; // Extract email and password from request body

    // Find the user by email in the database
    User.findOne({ "personal_info.email": email })
        .then((user) => {
            if (!user) {
                // If no user is found, send a 404 response
                return res.status(404).json({ error: "Email not found" });
            }

            // Compare the provided password with the hashed password in the database
            bcrypt.compare(
                password,
                user.personal_info.password,
                (err, result) => {
                    if (err) {
                        // Handle error during password comparison
                        return res.status(403).json({
                            error: "Error occurred while logging in, please try again",
                        });
                    }

                    if (!result) {
                        // If the passwords do not match, return an error
                        return res
                            .status(403)
                            .json({ error: "Invalid password" });
                    } else {
                        // If successful, format and send the user data with an access token
                        return res.status(200).json(formatDatatoSend(user));
                    }
                }
            );
        })
        .catch((err) => {
            // Handle any server-side errors
            return res.status(500).json({ error: err.message });
        });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
