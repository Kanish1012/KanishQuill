import { useContext, useEffect, useRef, useState } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { UserContext } from "../App";

const SideNav = () => {
    // Extract the access token from the user context
    let {
        userAuth: { access_token },
    } = useContext(UserContext);

    // Get the current page name from the URL path
    let page = location.pathname.split("/")[2];

    // State variables to manage the page state and sidebar visibility
    let [pageState, setPageState] = useState(page.replace("-", " "));
    let [showSideNav, setShowSideNav] = useState(false);

    // useRef hooks for referencing DOM elements
    let activeTabLine = useRef();
    let sideBarIconTab = useRef();
    let pageStateTab = useRef();

    // Function to handle the page state change and update the active tab line
    const changePageState = (e) => {
        let { offsetWidth, offsetLeft } = e.target;
        activeTabLine.current.style.width = offsetWidth + "px";
        activeTabLine.current.style.left = offsetLeft + "px";

        // Toggle sidebar visibility based on the clicked element
        if (e.target == sideBarIconTab.current) {
            setShowSideNav(true);
        } else {
            setShowSideNav(false);
        }
    };

    // useEffect to handle changes in the page state and trigger a click event to update the active tab
    useEffect(() => {
        setShowSideNav(false);
        pageStateTab.current.click();
    }, [pageState]);

    // Redirect to the signin page if the user is not authenticated
    return access_token === null ? (
        <Navigate to="/signin" />
    ) : (
        <>
            {/* Main container for the sidebar and page content */}
            <section className="relative flex gap-10 py-0 m-0 max-md:flex-col">
                {/* Sidebar wrapper with sticky positioning */}
                <div className="sticky top-[80px] z-30">
                    {/* Mobile view navigation bar with a toggle button and page title */}
                    <div className="md:hidden bg-white py-1 border-b border-grey flex flex-nowrap overflow-x-auto">
                        <button
                            className="p-5 capitalize"
                            ref={sideBarIconTab}
                            onClick={changePageState}
                        >
                            <i className="fi fi-rr-bars-staggered pointer-events-none"></i>
                        </button>
                        <button
                            className="p-5 capitalize"
                            ref={pageStateTab}
                            onClick={changePageState}
                        >
                            {pageState}
                        </button>
                        {/* Active tab line for visual indication */}
                        <hr
                            className="absolute bottom-0 duration-500"
                            ref={activeTabLine}
                        />
                    </div>

                    {/* Sidebar navigation links */}
                    <div
                        className={
                            "min-w-[200px] h-[calc(100vh-80px-60px)] md:h-cover md:sticky top-24 overflow-y-auto p-6 md:pr-0 md:border-grey md:border-r absolute max-md:top-[64px] bg-white max-md:w-[calc(100% + 80px)] max-md:px-16 max-md:-ml-7 duration-500 " +
                            (showSideNav || window.innerWidth >= 768
                                ? "opacity-100 pointer-events-auto z-50"
                                : "max-md:opacity-0 max-md:pointer-events-none")
                        }
                    >
                        {/* Dashboard heading */}
                        <h1 className="text-xl text-dark-grey mb-3">
                            Dashboard
                        </h1>
                        <hr className="border-grey -ml-6 mb-8 mr-6" />

                        {/* Navigation link to Blogs */}
                        <NavLink
                            to="/dashboard/blogs"
                            onClick={(e) => setPageState(e.target.innerText)}
                            className="sidebar-link"
                        >
                            <i className="fi fi-rr-document"></i>
                            Blogs
                        </NavLink>

                        {/* Navigation link to Notifications */}
                        <NavLink
                            to="/dashboard/notification"
                            onClick={(e) => setPageState(e.target.innerText)}
                            className="sidebar-link"
                        >
                            <i className="fi fi-rr-bell"></i>
                            Notification
                        </NavLink>

                        {/* Navigation link to Write (Editor) */}
                        <NavLink
                            to="/editor"
                            onClick={(e) => setPageState(e.target.innerText)}
                            className="sidebar-link"
                        >
                            <i className="fi fi-rr-file-edit"></i>
                            Write
                        </NavLink>

                        {/* Settings heading */}
                        <h1 className="text-xl text-dark-grey mt-20 mb-3">
                            Settings
                        </h1>
                        <hr className="border-grey -ml-6 mb-8 mr-6" />

                        {/* Navigation link to Edit Profile */}
                        <NavLink
                            to="/settings/edit-profile"
                            onClick={(e) => setPageState(e.target.innerText)}
                            className="sidebar-link"
                        >
                            <i className="fi fi-rr-user"></i>
                            Edit Profile
                        </NavLink>

                        {/* Navigation link to Change Password */}
                        <NavLink
                            to="/settings/change-password"
                            onClick={(e) => setPageState(e.target.innerText)}
                            className="sidebar-link"
                        >
                            <i className="fi fi-rr-lock"></i>
                            Change Password
                        </NavLink>
                    </div>
                </div>

                {/* Outlet to render nested routes */}
                <div className="max-md:-mt-8 mt-5 w-full">
                    <Outlet />
                </div>
            </section>
        </>
    );
};

export default SideNav;
