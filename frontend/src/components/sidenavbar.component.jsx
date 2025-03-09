import { Outlet } from "react-router-dom";

const SideNav = () => {
    return (
        <>
            <h1>SideNavbar</h1>
            <Outlet />
        </>
    );
};

export default SideNav;
