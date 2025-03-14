import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { profileDataStructure } from "./profile.page";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { Toaster } from "react-hot-toast";

const EditProfile = () => {
    let {
        userAuth,
        userAuth: { access_token },
    } = useContext(UserContext);

    const [profile, setProfile] = useState(profileDataStructure);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (access_token) {
            axios
                .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", {
                    username: userAuth.username,
                })
                .then(({ data }) => {
                    setProfile(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }, [access_token]);

    return (
        <AnimationWrapper>
            {loading ? (
                <Loader />
            ) : (
                <form>
                    <Toaster />
                </form>
            )}
        </AnimationWrapper>
    );
};

export default EditProfile;
