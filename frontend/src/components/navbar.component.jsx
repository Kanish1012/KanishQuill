import { useContext, useEffect, useState } from "react";
import darklogo from "../imgs/logo-dark.png";
import lightlogo from "../imgs/logo-light.png";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { ThemeContext, UserContext } from "../App";
import UserNavigationPanel from "./user-navigation.component";
import axios from "axios";
import { storeInSession } from "../common/session";

const Navbar = () => {
    const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
    const [userNavPanel, setUserNavPanel] = useState(false);

    let { theme, setTheme } = useContext(ThemeContext);

    let navigate = useNavigate();

    // Destructuring the user authentication and profile data from the UserContext
    const {
        userAuth,
        userAuth: { access_token, profile_img, new_notification_available },
        setUserAuth,
    } = useContext(UserContext);

    useEffect(() => {
        if (access_token) {
            axios
                .get(import.meta.env.VITE_SERVER_DOMAIN + "/new-notification", {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                })
                .then(({ data }) => {
                    setUserAuth({ ...userAuth, ...data });
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    }, [access_token]);

    // Toggles the user navigation panel visibility
    const handleUserNavPanel = () => {
        setUserNavPanel(!userNavPanel);
    };

    // Handles the search functionality when the user presses the Enter key
    const handleSearch = (e) => {
        let query = e.target.value;
        if (e.keyCode == 13 && query.length) {
            navigate(`/search/${query}`);
            e.target.value = "";
        }
    };

    // Hides the user navigation panel after a short delay when losing focus
    const handleBlur = () => {
        setTimeout(() => {
            setUserNavPanel(false);
        }, 200);
    };

    // Changes the theme of the application
    const changeTheme = () => {
        let newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.body.setAttribute("data-theme", newTheme);
        storeInSession("theme", newTheme);
    };

    return (
        <>
            {/* Main navigation bar */}
            <nav className="navbar z-50">
                {/* Logo linking to the home page */}
                <Link to="/" className="flex-none w-10">
                    <img src={theme=='light'? darklogo : lightlogo} className="w-full" />
                </Link>

                {/* Search box */}
                <div
                    className={
                        "absolute bg-white w-full left-0 top-full mt-0.5 border-b border-grey py-4 px-[5vw] md:border-0 md:block md:relative md:inset-0 md:p-0 md:w-auto md:show " +
                        (searchBoxVisibility ? "show" : "hide")
                    }
                >
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full md:w-auto bg-grey p-4 pl-6 pr-[12%] md:pr-6 rounded-full placeholder:text-dark-grey md:pl-12"
                        onKeyDown={handleSearch}
                    />
                    <i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey"></i>
                </div>

                {/* Buttons and actions on the right side of the navbar */}
                <div className="flex items-center gap-3 md:gap-6 ml-auto">
                    {/* Button to toggle search box visibility on mobile */}
                    <button
                        className="md:hidden bg-grey w-12 h-12 rounded-full flex items-center justify-center"
                        onClick={() =>
                            setSearchBoxVisibility(
                                (currentValue) => !currentValue
                            )
                        }
                    >
                        <i className="fi fi-rr-search text-xl" />
                    </button>

                    {/* Link to the editor page */}
                    <Link to="/editor" className="hidden md:flex gap-2 link">
                        <i className="fi fi-rr-file-edit"></i>
                        <p>Write</p>
                    </Link>

                    {/* Button to toggle theme */}
                    <button
                        className="w-12 h-12 rounded-full bg-grey relative hover:bg-black/10 flex items-center justify-center"
                        onClick={changeTheme}
                    >
                        <i
                            className={
                                "text-2xl block mt-1fi " +
                                (theme == "light"
                                    ? "fi-rr-moon-stars"
                                    : "fi-rr-sun")
                            }
                        ></i>
                    </button>

                    {/* Conditional rendering based on authentication */}
                    {access_token ? (
                        <>
                            {/* Notification button */}
                            <Link to="/dashboard/notifications">
                                <button className="w-12 h-12 rounded-full bg-grey relative hover:bg-black/10">
                                    <i className="fi fi-rr-bell text-2xl block mt-1"></i>
                                    {new_notification_available ? (
                                        <span className="bg-red w-3 h-3 rounded-full absolute z-10 top-2 right-2"></span>
                                    ) : (
                                        ""
                                    )}
                                </button>
                            </Link>

                            {/* User profile picture with dropdown menu */}
                            <div
                                className="relative"
                                onClick={handleUserNavPanel}
                                onBlur={handleBlur}
                            >
                                <button className="w-12 h-12 mt-1">
                                    <img
                                        src={profile_img}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                </button>
                                {/* User navigation panel dropdown */}
                                {userNavPanel ? <UserNavigationPanel /> : ""}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Sign-in button */}
                            <Link to="/signin" className="btn-dark py-2">
                                Sign-in
                            </Link>

                            {/* Sign-up button, visible on larger screens */}
                            <Link
                                to="/signup"
                                className="btn-light py-2 hidden md:block"
                            >
                                Sign-up
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Outlet for rendering nested components */}
            <Outlet />
        </>
    );
};

export default Navbar;
