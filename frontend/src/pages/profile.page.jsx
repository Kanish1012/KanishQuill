import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { UserContext } from "../App";
import AboutUser from "../components/about.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import InPageNavigation from "../components/inpage-navigation.component";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import PageNotFound from "./404.page";

// Define the initial structure of a user's profile data
export const profileDataStructure = {
    personal_info: {
        fullname: "",
        username: "",
        profile_img: "",
        bio: "",
    },
    account_info: {
        total_posts: 0,
        total_reads: 0,
    },
    social_links: {},
    joinedAt: "",
};

const ProfilePage = () => {
    let { id: profileId } = useParams(); // Get the profile ID from URL parameters
    let [profile, setProfile] = useState(profileDataStructure); // State to store profile data
    let [loading, setLoading] = useState(true); // Loading state
    let [blogs, setBlog] = useState(null); // State to store user's blog posts
    let [profileLoaded, setProfileLoaded] = useState(""); // State to track if the profile is already loaded

    // Destructure profile data for easier access
    let {
        personal_info: {
            fullname,
            username: profile_username,
            profile_img,
            bio,
        },
        account_info: { total_posts, total_reads },
        social_links,
        joinedAt,
    } = profile;

    // Get the logged-in user's username from context
    let {
        userAuth: { username },
    } = useContext(UserContext);

    // Function to fetch user profile data
    const fetchUserProfile = () => {
        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", {
                username: profileId, // Pass the profile ID to fetch user details
            })
            .then(({ data: user }) => {
                if (user != null) {
                    setProfile(user); // Update profile state with fetched data
                }
                setProfileLoaded(profileId); // Mark profile as loaded
                getBlogs({ user_id: user._id }); // Fetch user's blog posts
                setLoading(false); // Set loading to false
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });
    };

    // Function to reset states when switching profiles
    const resetStates = () => {
        setProfile(profileDataStructure);
        setLoading(true);
        setProfileLoaded("");
    };

    // Function to fetch user's blogs
    const getBlogs = ({ page = 1, user_id }) => {
        user_id = user_id == undefined ? blogs.user_id : user_id; // Use existing user_id if not provided

        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {
                author: user_id,
                page,
            })
            .then(async ({ data }) => {
                let formatedData = await filterPaginationData({
                    state: blogs,
                    data: data.blogs,
                    page,
                    countRoute: "/search-blogs-count",
                    data_to_send: { author: user_id },
                });

                formatedData.user_id = user_id;
                setBlog(formatedData); // Update blog state with new data
            });
    };

    // useEffect to fetch profile data when profileId or blogs change
    useEffect(() => {
        if (profileId != profileLoaded) {
            setBlog(null);
        }
        if (blogs == null) {
            resetStates();
            fetchUserProfile();
        }
    }, [profileId, blogs]);

    return (
        <AnimationWrapper>
            {loading ? (
                <Loader /> // Show loader while fetching data
            ) : profile_username.length ? (
                <section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12">
                    {/* Profile Sidebar Section */}
                    <div className="flex flex-col max:md: items-center gap-5 min-w-[250px]">
                        {/* User Profile Image */}
                        <img
                            src={profile_img}
                            className="w-48 h-48 bg-grey rounded-full md:w-32 md:h-32"
                        />
                        {/* Display Username */}
                        <h1 className="text-2xl font-medium">
                            @{profile_username}
                        </h1>
                        {/* Display Full Name */}
                        <p className="text-xl capitalize h-6">{fullname}</p>
                        {/* Display Blog and Read Counts */}
                        <p>
                            {total_posts.toLocaleString()} Blogs -{" "}
                            {total_reads.toLocaleString()} reads
                        </p>
                        {/* Edit Profile Button (only for logged-in user) */}
                        <div className="flex gap-4 mt-2">
                            {profileId == username ? (
                                <Link
                                    to="/settings/edit-profile"
                                    className="btn-light rounded-md"
                                >
                                    Edit Profile
                                </Link>
                            ) : (
                                ""
                            )}
                        </div>

                        {/* Display About User Section */}
                        <AboutUser
                            className={"max-md:hidden"}
                            bio={bio}
                            social_links={social_links}
                            joinedAt={joinedAt}
                        />
                    </div>

                    {/* Blog Posts Section */}
                    <div className="max-md:mt-12 w-full">
                        <InPageNavigation
                            routes={["Blogs Published", "About"]}
                            defaultHidden={["About"]}
                        >
                            <>
                                {/* Show Loader while fetching blogs */}
                                {blogs == null ? (
                                    <Loader />
                                ) : blogs.results.length ? (
                                    blogs.results.map((blog, i) => {
                                        return (
                                            <AnimationWrapper
                                                transition={{
                                                    duration: 1,
                                                    delay: i * 0.1,
                                                }}
                                                key={i}
                                            >
                                                <BlogPostCard
                                                    content={blog}
                                                    author={
                                                        blog.author
                                                            .personal_info
                                                    }
                                                />
                                            </AnimationWrapper>
                                        );
                                    })
                                ) : (
                                    <NoDataMessage message="No Blogs Published" />
                                )}
                                {/* Load More Button */}
                                <LoadMoreDataBtn
                                    state={blogs}
                                    fetchDataFun={getBlogs}
                                />
                            </>

                            {/* About Section */}
                            <AboutUser
                                bio={bio}
                                social_links={social_links}
                                joinedAt={joinedAt}
                            />
                        </InPageNavigation>
                    </div>
                </section>
            ) : (
                <PageNotFound /> // Show 404 page if profile does not exist
            )}
        </AnimationWrapper>
    );
};

export default ProfilePage;
