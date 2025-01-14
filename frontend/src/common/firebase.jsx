import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCWiOdIPvCVdnvmdnVS34Ewo1ySkKjmyU4",
    authDomain: "blog-website-kanish.firebaseapp.com",
    projectId: "blog-website-kanish",
    storageBucket: "blog-website-kanish.firebasestorage.app",
    messagingSenderId: "483655346553",
    appId: "1:483655346553:web:3fd353915a83796443e7a8",
};

const app = initializeApp(firebaseConfig);

// google auth
const provider = new GoogleAuthProvider();

const auth = getAuth();

export const authWithGoogle = async () => {
    let user = null;
    await signInWithPopup(auth, provider)
        .then((result) => {
            user = result.user;
        })
        .catch((err) => {
            console.log(err);
        });

    return user;
};
