import { useContext, useRef } from "react";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { UserContext } from "../App";

const ChangePassword = () => {
    // Get the access token from the user context
    let {
        userAuth: { access_token },
    } = useContext(UserContext);

    // Reference to the password change form
    let changePasswordForm = useRef();

    // Regex pattern to validate password (6-20 chars, includes number, uppercase, lowercase)
    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Collect form data into an object
        let form = new FormData(changePasswordForm.current);
        let formData = {};

        for (let [key, value] of form.entries()) {
            formData[key] = value;
        }

        let { currentPassword, newPassword } = formData;

        // Check for empty inputs
        if (!currentPassword.length || !newPassword.length) {
            return toast.error("Fill all the inputs");
        }

        // Validate the password format
        if (
            !passwordRegex.test(currentPassword) ||
            !passwordRegex.test(newPassword)
        ) {
            return toast.error(
                "Password must be 6-20 characters long and include a number, uppercase, and lowercase letter"
            );
        }

        // Check if the new password is the same as the current one
        if (currentPassword == newPassword) {
            return toast.error("Current and new password can't be the same");
        }

        // Disable the button to prevent multiple submissions
        e.target.setAttribute("disabled", true);

        // Show loading toast
        let loadingToast = toast.loading("Updating...");

        // Make API request to update the password
        axios
            .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/change-password",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                }
            )
            .then(() => {
                // Dismiss loading and show success toast
                toast.dismiss(loadingToast);
                e.target.removeAttribute("disabled");
                return toast.success("Password Updated");
            })
            .catch(({ response }) => {
                // Dismiss loading and show error toast
                toast.dismiss(loadingToast);
                e.target.removeAttribute("disabled");
                return toast.error(response.data.error);
            });
    };

    return (
        <AnimationWrapper>
            <Toaster />
            <form ref={changePasswordForm}>
                <h1 className="max-md:hidden">Change Password</h1>

                <div className="py-10 w-full md:max-w-[400px]">
                    <InputBox
                        name="currentPassword"
                        type="password"
                        className="profile-edit-input"
                        placeholder="Current Password"
                        icon="fi-rr-unlock"
                    />

                    <InputBox
                        name="newPassword"
                        type="password"
                        className="profile-edit-input"
                        placeholder="New Password"
                        icon="fi-rr-unlock"
                    />

                    {/* Submit button to change the password */}
                    <button
                        onClick={handleSubmit}
                        className="btn-dark px-10"
                        type="submit"
                    >
                        Change Password
                    </button>
                </div>
            </form>
        </AnimationWrapper>
    );
};

export default ChangePassword;
