# KanishQuill 🖋️

**KanishQuill** is a modern, full-stack blog platform built using the MERN stack (MongoDB, Express, React, Node.js). Designed for readers and writers alike, it offers a clean, responsive UI and essential features to make blogging seamless and enjoyable.

---

## ✨ Features

- 🏠 Home page with latest blog posts
- 🔥 "Trending Blogs" section based on popularity or views
- 📝 Individual blog pages with full content
- 💬 Comment system
- 🔍 Search functionality
- 🌙 Light/Dark mode toggle
- 📱 Fully responsive design

---

## 🧰 Tech Stack

- Frontend: React, HTML5, CSS3, Tailwind
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose for modeling)
- AWS for storing blog images


Clone the Repository and in terminal run:
npm install (in both /frontend and /server)

create a .env file in frontend folder and add these:

VITE_SERVER_DOMAIN=http://localhost:3000

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

create a .env file in server folder and add these with your MongoDB address and keys :

DB_LOCATION=

SECRET_ACCESS_KEY=

AWS_SECRET_ACCESS_KEY=

AWS_ACCESS_KEY=

AWS_BUCKET_NAME=

use npm run dev (for /frontend)
use npm start (for /server)




