import { Toaster, toast } from "react-hot-toast";
import { useContext, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";

const NotificationCommentField = ({
    _id,
    blog_author,
    index = undefined,
    replyingTo = undefined,
    setReplying,
    notification_id,
    notificationData,
}) => {
    let [comment, setComment] = useState("");

    // Extract blog author's user ID
    let { _id: user_id } = blog_author;

    // Get access token from user context
    let {
        userAuth: { access_token },
    } = useContext(UserContext);

    // Get notifications and update function from props
    let {
        notifications,
        notifications: { results },
        setNotifications,
    } = notificationData;

    // Submit comment
    const handleComment = () => {
        if (!comment.length) {
            return toast.error("Write something to comment"); // Show error if empty
        }

        // Send comment data to the server
        axios
            .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/add-comment",
                {
                    _id,
                    blog_author: user_id,
                    notification_id,
                    comment,
                    replying_to: replyingTo,
                },
                { headers: { Authorization: `Bearer ${access_token}` } }
            )
            .then(({ data }) => {
                setReplying(false); // Close reply input
                results[index].reply = { comment, _id: data._id }; // Add reply to notification
                setNotifications({ ...notifications, results }); // Update state
            })
            .catch((err) => {
                console.log(err); // Log error
            });
    };

    return (
        <>
            <Toaster />
            <textarea
                value={comment}
                placeholder="Leave a reply..."
                className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
                onChange={(e) => setComment(e.target.value)} // Update comment value
            ></textarea>
            <button className="btn-dark mt-5 px-10" onClick={handleComment}>
                Reply
            </button>
        </>
    );
};

export default NotificationCommentField;
