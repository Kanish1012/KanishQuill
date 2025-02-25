import { useContext } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import { UserContext } from "../App";

const BlogInteraction = () => {
    // Extract blog data and setter function from BlogContext
    let {
        blog: {
            blog_id,
            activity,
            activity: { total_likes, total_comments },
            author: {
                personal_info: { username: author_username },
            },
        },
        setBlog,
    } = useContext(BlogContext);

    // Extract current user's authentication data from UserContext
    let {
        userAuth: { username },
    } = useContext(UserContext);

    return (
        <>
            {/* Divider line */}
            <hr className="border-grey my-2" />

            {/* Like & Comment Interaction Section */}
            <div className="flex gap-6 justify-between items-center">
                <div className="flex gap-3 items-center">
                    {/* Like Button */}
                    <button className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
                        <i className="fi fi-rr-heart"></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_likes}</p>

                    {/* Comment Button */}
                    <button className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
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
