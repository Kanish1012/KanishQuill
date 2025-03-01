import { useContext, useEffect } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const BlogInteraction = () => {
    // Extract blog data and setter function from BlogContext
    let {
        blog,
        blog: {
            _id,
            title,
            blog_id,
            activity,
            activity: { total_likes, total_comments },
            author: {
                personal_info: { username: author_username },
            },
        },
        setBlog,
        isLikedByUser,
        setIsLikedByUser,
        setCommentsWrapper,
    } = useContext(BlogContext);

    // Extract current user's authentication data from UserContext
    let {
        userAuth: { username, access_token },
    } = useContext(UserContext);

    useEffect(() => {
        if (access_token) {
            axios
                .post(
                    import.meta.env.VITE_SERVER_DOMAIN + "/isliked-by-user",
                    { _id },
                    { headers: { Authorization: `Bearer ${access_token}` } }
                )
                .then(({ data: { result } }) => {
                    setIsLikedByUser(Boolean(result));
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }, []);

    const handleLike = () => {
        if (access_token) {
            // Like the blog
            setIsLikedByUser((preVal) => !preVal);
            !isLikedByUser ? total_likes++ : total_likes--;
            setBlog({ ...blog, activity: { ...activity, total_likes } });
            console.log("Access Token:", access_token);
            axios
                .post(
                    import.meta.env.VITE_SERVER_DOMAIN + "/like-blog",
                    {
                        _id,
                        isLikedByUser,
                    },
                    { headers: { Authorization: `Bearer ${access_token}` } }
                )
                .then(({ data }) => {
                    console.log(data);
                })
                .catch((err) => {
                    console.log(err);
                });
        }
        else{
            toast.error("Please login to like the blog");
        }
    };

    return (
        <>
            <Toaster />
            {/* Divider line */}
            <hr className="border-grey my-2" />

            {/* Like & Comment Interaction Section */}
            <div className="flex gap-6 justify-between items-center">
                <div className="flex gap-3 items-center">
                    {/* Like Button */}
                    <button
                        className={
                            "w-10 h-10 rounded-full flex items-center justify-center " +
                            (isLikedByUser
                                ? "bg-red/20 text-red"
                                : "bg-grey/80")
                        }
                        onClick={handleLike}
                    >
                        <i
                            className={
                                "fi " +
                                (isLikedByUser
                                    ? "fi-sr-heart "
                                    : "fi-rr-heart ")
                            }
                        ></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_likes}</p>

                    {/* Comment Button */}
                    <button
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80"
                        onClick={() => setCommentsWrapper((preVal) => !preVal)}
                    >
                        <i className="fi fi-rr-comment-dots"></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_comments}</p>
                </div>

                {/* Edit Button - Visible only if the logged-in user is the blog author */}
                <div className="flex gap-6 items-center">
                    {username === author_username ? (
                        <Link
                            to={`/editor/${blog_id}`}
                            className="underline hover:text-purple"
                        >
                            Edit
                        </Link>
                    ) : (
                        ""
                    )}
                </div>
            </div>

            {/* Divider line */}
            <hr className="border-grey my-2" />
        </>
    );
};

export default BlogInteraction;
