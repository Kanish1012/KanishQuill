import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";

//Schema
import User from "./Schema/User.js";

const server = express();
let PORT = 3000;

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true,
});

server.post("/signup", (req, res) => {
    let { fullname, email, password } = req.body;

    if (fullname.length < 3) {
        res.status(403).json({
            error: "fullname must be atleast 3 letters long",
        });
    }
    if (!email.length) {
        res.status(403).json({ error: "Enter email" });
    }
    if (!emailRegex.test(email)) {
        res.status(403).json({ error: "Invalid email" });
    }
    if (!passwordRegex.test(password)) {
        res.status(403).json({
            error: "Password must be atleast 6 to 20 characters long with a numeric, uppercase, lowercase",
        });
    }

    bcrypt.hash(password, 10, (err, hashed_password) => {
        let username = email.split("@")[0];
        let user = new User({
            personal_info: {
                fullname,
                email,
                password: hashed_password,
                username,
            },
        });
        user.save()
            .then((u) => {
                return res.status(200).json({ user: u });
            })
            .catch((err) => {
                if ((err.code = 11000)) {
                    res.status(403).json({ error: "Email already exists" });
                }
                return res.status(500).json({ error: err.message });
            });
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
