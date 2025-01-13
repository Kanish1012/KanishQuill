import express from "express";
import mongoose from "mongoose";
import "dotenv/config";

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

    return res.status(200).json({ status: "ok" });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
