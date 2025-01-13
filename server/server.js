import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

// Import User schema
import User from "./Schema/User.js";

const server = express();
let PORT = 3000;

// Email and password validation regex
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

// Middleware to parse JSON requests
server.use(express.json());

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

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
