import { Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { useContext } from "react";
import { UserContext } from "../App";

const UserNavigationPanel = () => {
    const {
        userAuth: { username },
    } = useContext(UserContext);

    return (
        <AnimationWrapper transition={{ duration: 0.2 }} className="absolute right-0 z-50">
            <div className="bg-white absolute right-0 border border-grey w-60 overflow-hidden duration-200">
                <Link
                    to="/editor"
                    className="flex gap-2 link md:hidden pl-8 py-4"
                >
                    <i className="fi fi-rr-file-edit"></i>
                    <p>Write</p>
                </Link>

                <Link to={`/user/${username}`} className="link pl-8 py-4">
                    Profile
                </Link>

                <Link to="/dashboard/blog" className="link pl-8 py-4">
                    Dashboard
                </Link>

                <Link to="/settings/edit-profile" className="link pl-8 py-4">
                    Settings
                </Link>
            </div>
        </AnimationWrapper>
    );
};

export default UserNavigationPanel;
