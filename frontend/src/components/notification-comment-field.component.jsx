import { Toaster } from "react-hot-toast";
import { useState } from "react";

const NotificationCommentField = () => {
    let [comment, setComment] = useState("");

    const handleComment = () => {
        console.log("clicked");
    };

    return (
        <>
            <Toaster />
            <textarea
                value={comment}
                placeholder="Leave a reply..."
                className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
                onChange={(e) => {
                    setComment(e.target.value);
                }}
            ></textarea>
            <button className="btn-dark mt-5 px-10" onClick={handleComment}>
                Reply
            </button>
        </>
    );
};

export default NotificationCommentField;
