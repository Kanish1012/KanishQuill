import { useContext, useState } from "react"; // Import necessary hooks
import { UserContext } from "../App"; // Import UserContext for user authentication
import toast, { Toaster } from "react-hot-toast"; // Import toast for notifications
import axios from "axios"; // Import axios for making API requests
import { BlogContext } from "../pages/blog.page"; // Import BlogContext for blog-related data

const CommentField = ({
    action,
    index = undefined,
    replyingTo = undefined,
    setReplying,
}) => {
    // Extract necessary data from BlogContext
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

    // Extract user authentication details from UserContext
    let {
        userAuth: { access_token, username, fullname, profile_img },
    } = useContext(UserContext);

    const [comment, setComment] = useState(""); // State to manage comment input

    // Function to handle comment submission
    const handleComment = () => {
        if (!access_token) {
            return toast.error("Please login to comment"); // Show error if user is not logged in
        }

        if (!comment.length) {
            return toast.error("Write something to comment"); // Show error if comment is empty
        }

        // Send comment data to the server
        axios
            .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/add-comment",
                { _id, blog_author, comment, replying_to: replyingTo },
                { headers: { Authorization: `Bearer ${access_token}` } }
            )
            .then(({ data }) => {
                setComment(""); // Clear input field after successful submission

                // Add user info to the new comment data
                data.commented_by = {
                    personal_info: { username, profile_img, fullname },
                };

                let newCommentArr;

                if (replyingTo) {
                    // Handle replies by updating the parent comment
                    commentsArr[index].children.push(data._id);
                    data.childrenLevel = commentsArr[index].childrenLevel + 1;
                    data.parentIndex = index;
                    commentsArr[index].isReplyLoaded = true;
                    commentsArr.splice(index + 1, 0, data);
                    newCommentArr = commentsArr;
                    setReplying(false);
                } else {
                    // Add a new parent comment
                    data.childrenLevel = 0;
                    newCommentArr = [data, ...commentsArr];
                }

                let parentCommentIncrementVal = replyingTo ? 0 : 1;

                // Update blog state with the new comment
                setBlog({
                    ...blog,
                    comments: { ...comments, results: newCommentArr },
                    activity: {
                        ...activity,
                        total_comments: total_comments + 1,
                        total_parent_comments:
                            total_parent_comments + parentCommentIncrementVal,
                    },
                });

                // Update total parent comments count
                setTotalParentCommentsLoaded(
                    (preVal) => preVal + parentCommentIncrementVal
                );
            })
            .catch((err) => {
                console.log(err); // Log error if request fails
            });
    };

    return (
        <>
            <Toaster /> {/* Notification container */}
            <textarea
                value={comment}
                placeholder="Leave a comment..."
                className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
                onChange={(e) => {
                    setComment(e.target.value); // Update state on input change
                }}
            ></textarea>
            <button className="btn-dark mt-5 px-10" onClick={handleComment}>
                {action}
            </button>
        </>
    );
};

export default CommentField;
