import { Link, useNavigate } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { useContext } from "react";
import { UserContext } from "../App";
import { removeFromSession } from "../common/session";

const UserNavigationPanel = () => {
    const navigate = useNavigate();

    // Accessing the user's authentication details and updater function from UserContext
    const {
        userAuth: { username },
        setUserAuth,
    } = useContext(UserContext);

    // Function to sign out the user
    const signOutUser = () => {
        // Remove user data from the session storage
        removeFromSession("user");
        // Reset user authentication state
        setUserAuth({ access_token: null });
        // Redirect to the home page
        navigate("/");
    };

    return (
        <AnimationWrapper
            transition={{ duration: 0.2 }} // Animation properties for smooth appearance
            className="absolute right-0 z-50"
        >
            <div className="bg-white absolute right-0 border border-grey w-60 duration-200">
                {/* Mobile-specific link to the editor */}
                <Link
                    to="/editor"
                    className="flex gap-2 link md:hidden pl-8 py-4"
                >
                    <i className="fi fi-rr-file-edit"></i>
                    <p>Write</p>
                </Link>

                {/* Link to the user's profile */}
                <Link to={`/user/${username}`} className="link pl-8 py-4">
                    Profile
                </Link>

                {/* Link to the user's blog dashboard */}
                <Link to="/dashboard/blogs" className="link pl-8 py-4">
                    Dashboard
                </Link>

                {/* Link to the settings page for editing profile */}
                <Link to="/settings/edit-profile" className="link pl-8 py-4">
                    Settings
                </Link>

                {/* Separator line */}
                <span className="absolute border-t border-grey w-[100%]"></span>

                {/* Sign-out button */}
                <button
                    className="text-left p-4 hover:bg-grey w-full py-4 pl-8"
                    onClick={signOutUser}
                >
                    <h1 className="font-bold text-xl mg-1">Sign out</h1>
                    <p className="text-dark-grey">@{username}</p>
                </button>
            </div>
        </AnimationWrapper>
    );
};

export default UserNavigationPanel;
