import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { profileDataStructure } from "./profile.page";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { Toaster } from "react-hot-toast";
import InputBox from "../components/input.component";

const EditProfile = () => {
    let {
        userAuth,
        userAuth: { access_token },
    } = useContext(UserContext);

    let bioLimit = 150;

    const [profile, setProfile] = useState(profileDataStructure);
    const [loading, setLoading] = useState(true);
    const [charactersLeft, setCharactersLeft] = useState(bioLimit);

    let {
        personal_info: {
            fullname,
            username: profile_username,
            profile_img,
            email,
            bio,
        },
        social_links,
    } = profile;

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

    const handleCharacterChange = (e) => {
        setCharactersLeft(bioLimit - e.target.value.length);
    };

    return (
        <AnimationWrapper>
            {loading ? (
                <Loader />
            ) : (
                <form>
                    <Toaster />

                    <h1 className="max-md:hidden">Edit Profile</h1>
                    <div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">
                        <div className="max-lg:center mb-5">
                            <label
                                htmlFor="uploadImage"
                                id="profileImgLabel"
                                className="relative block w-48 h-48 bg-grey rounded-full overflow-hidden"
                            >
                                <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white bg-black/30 opacity-0 hover:opacity-100 cursor-pointer">
                                    Upload Image
                                </div>
                                <img src={profile_img} />
                            </label>
                            <input
                                type="file"
                                id="uploadImage"
                                accept=".jpeg, .png, .jpg"
                                hidden
                            />

                            <button className="btn-light mt-5 max-lg:center lg:w-full px-10">
                                Upload
                            </button>
                        </div>

                        <div className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
                                <div>
                                    <InputBox
                                        name="fullanme"
                                        type="text"
                                        value={fullname}
                                        placeholder="Full name"
                                        disable={true}
                                        icon="fi-rr-user"
                                    />
                                </div>

                                <div>
                                    <InputBox
                                        name="email"
                                        type="email"
                                        value={email}
                                        placeholder="Email"
                                        disable={true}
                                        icon="fi-rr-envelope"
                                    />
                                </div>
                            </div>

                            <InputBox
                                type="text"
                                name="username"
                                value={profile_username}
                                placeholder="Username"
                                icon="fi-rr-at"
                            />

                            <p className="text-dark-grey -mt-3">
                                Username will be used to search user and will be
                                visible to all users
                            </p>

                            <textarea
                                name="bio"
                                maxLength={bioLimit}
                                defaultValue={bio}
                                className="input-box h-64 lg:h-40 resize-none leading-7 mt-5 pl-5"
                                placeholder="bio"
                                onChange={handleCharacterChange}
                            ></textarea>

                            <p className="mt-1 text-dark-grey">{charactersLeft} characters left</p>
                        </div>
                    </div>
                </form>
            )}
        </AnimationWrapper>
    );
};

export default EditProfile;
