import { useContext, useState } from "react";
import { UserContext } from "../App";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { BlogContext } from "../pages/blog.page";

const CommentField = ({
    action,
    index = undefined,
    replyingTo = undefined,
    setReplying,
}) => {
    // Destructure blog and related states from context
    let {
        blog,
        blog: {
            _id,
            author: { _id: blog_author },
            comments,
            comments: { results: commentsArr },
            activity,
            activity: { total_comments, total_parent_comments },
        },
        setBlog,
        setTotalParentCommentsLoaded,
    } = useContext(BlogContext);

    // Destructure user info from context
    let {
        userAuth: { access_token, username, fullname, profile_img },
    } = useContext(UserContext);

    const [comment, setComment] = useState(""); // Comment input state

    // Handle comment submit
    const handleComment = () => {
        if (!access_token) return toast.error("Please login to comment"); // Not logged in
        if (!comment.length) return toast.error("Write something to comment"); // Empty comment

        // Submit comment
        axios
            .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/add-comment",
                { _id, blog_author, comment, replying_to: replyingTo },
                { headers: { Authorization: `Bearer ${access_token}` } }
            )
            .then(({ data }) => {
                setComment(""); // Clear input
                data.commented_by = {
                    personal_info: { username, profile_img, fullname },
                };

                let newCommentArr;

                if (replyingTo) {
                    // Add reply below the parent comment
                    commentsArr[index].children.push(data._id);
                    data.childrenLevel = commentsArr[index].childrenLevel + 1;
                    data.parentIndex = index;
                    commentsArr[index].isReplyLoaded = true;
                    commentsArr.splice(index + 1, 0, data);
                    newCommentArr = commentsArr;
                    setReplying(false);
                } else {
                    // Add as a new parent comment
                    data.childrenLevel = 0;
                    newCommentArr = [data, ...commentsArr];
                }

                // Update blog state with new comment
                setBlog({
                    ...blog,
                    comments: { ...comments, results: newCommentArr },
                    activity: {
                        ...activity,
                        total_comments: total_comments + 1,
                        total_parent_comments:
                            total_parent_comments + (replyingTo ? 0 : 1),
                    },
                });

                // Update loaded parent count if not a reply
                if (!replyingTo) {
                    setTotalParentCommentsLoaded((prev) => prev + 1);
                }
            })
            .catch((err) => console.log(err)); // Log error
    };

    return (
        <>
            <Toaster /> {/* Toast container */}
            <textarea
                value={comment}
                placeholder="Leave a comment..."
                className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
                onChange={(e) => setComment(e.target.value)} // Update input
            ></textarea>
            <button className="btn-dark mt-5 px-10" onClick={handleComment}>
                {action}
            </button>
        </>
    );
};

export default CommentField;
