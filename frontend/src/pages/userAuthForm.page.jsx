import { Link, Navigate } from "react-router-dom";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import AnimationWrapper from "../common/page-animation";
import { useContext, useRef } from "react";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";

const UserAuthForm = ({ type }) => {
    // Destructure user authentication data and setter from UserContext
    let {
        userAuth: { access_token },
        setUserAuth,
    } = useContext(UserContext);

    // Function to handle server communication for authentication
    const userAuthThroughServer = (serverRoute, formData) => {
        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData)
            .then(({ data }) => {
                // Store user data in session and update context
                storeInSession("user", JSON.stringify(data));
                setUserAuth(data);
            })
            .catch(({ response }) => {
                // Display error message on failure
                toast.error(response.data.error);
            });
    };

    // Form submission handler
    const handleSubmit = (e) => {
        e.preventDefault();

        // Determine server route based on the form type
        let serverRoute = type == "sign-in" ? "/signin" : "/signup";

        // Validation regex for email and password
        let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

        // Extract form data
        let form = new FormData(formElement);
        let formData = {};

        for (let [key, value] of form.entries()) {
            formData[key] = value;
        }

        // Validate form fields
        let { fullname, email, password } = formData;
        if (fullname) {
            if (fullname.length < 3) {
                return toast.error("Full name must be at least 3 letters long");
            }
        }

        if (!email.length) {
            return toast.error("Enter email");
        }
        if (!emailRegex.test(email)) {
            return toast.error("Invalid email");
        }

        if (type == "sign-up") {
            if (!passwordRegex.test(password)) {
                return toast.error(
                    "Password must be 6-20 characters long and include a number, uppercase, and lowercase letter"
                );
            }
        }

        // Send validated data to server
        userAuthThroughServer(serverRoute, formData);
    };

    // Google authentication handler
    const handleGoogleAuth = (e) => {
        e.preventDefault();
        authWithGoogle()
            .then((user) => {
                let serverRoute = "/google-auth";
                let formData = {
                    access_token: user.accessToken,
                };
                // Send Google authentication data to server
                userAuthThroughServer(serverRoute, formData);
            })
            .catch((err) => {
                // Display error message for failed Google login
                toast.error("Trouble logging in");
                return console.log(err);
            });
    };

    // Redirect authenticated user to home page
    return access_token ? (
        <Navigate to="/" />
    ) : (
        <AnimationWrapper keyValue={type}>
            <section className="h-cover flex items-center justify-center">
                <Toaster />
                <form id="formElement" className="w-[80%] max-w-[400px]">
                    {/* Heading */}
                    <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
                        {type == "sign-in" ? "Welcome back" : "Join Us today"}
                    </h1>

                    {/* Full name input, displayed only for sign-up */}
                    {type != "sign-in" ? (
                        <InputBox
                            name="fullname"
                            type="text"
                            placeholder="Full Name"
                            icon="fi-rr-user"
                        />
                    ) : (
                        ""
                    )}

                    {/* Email input */}
                    <InputBox
                        name="email"
                        type="email"
                        placeholder="Email"
                        icon="fi-rr-envelope"
                    />

                    {/* Password input */}
                    <InputBox
                        name="password"
                        type="password"
                        placeholder="Password"
                        icon="fi-rr-key"
                    />

                    {/* Submit button */}
                    <button
                        className="btn-dark center mt-14"
                        type="submit"
                        onClick={handleSubmit}
                    >
                        {type.replace("-", " ")}
                    </button>

                    {/* Divider for alternate authentication options */}
                    <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
                        <hr className="w-1/2 border-black" />
                        <p>or</p>
                        <hr className="w-1/2 border-black" />
                    </div>

                    {/* Google authentication button */}
                    <button
                        className="btn-dark flex items-center justify-center gap-4 w-[90%] center"
                        onClick={handleGoogleAuth}
                    >
                        <img src={googleIcon} className="w-5 " />
                        Continue with google
                    </button>

                    {/* Toggle link between sign-in and sign-up */}
                    {type == "sign-in" ? (
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Don't have and account?
                            <Link
                                to="/signup"
                                className="underline text-black text-xl ml-1"
                            >
                                Join us today
                            </Link>
                        </p>
                    ) : (
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Already a member?
                            <Link
                                to="/signin"
                                className="underline text-black text-xl ml-1"
                            >
                                Sign in here
                            </Link>
                        </p>
                    )}
                </form>
            </section>
        </AnimationWrapper>
    );
};

export default UserAuthForm;
