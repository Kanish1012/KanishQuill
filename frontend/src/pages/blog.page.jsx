import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export const blogStructure = {
    title: "",
    banner: "",
    author: { personal_info: {} },
    des: "",
    content: [],
    tags: [],
    publishedAt: "",
};

const BlogPage = () => {
    let { blog_id } = useParams();
    const [blog, setBlog] = useState(blogStructure);
    let {
        title,
        content,
        banner,
        author: {
            personal_info: { fullname, username, profile_img },
        },
        publishedAt,
    } = blog;

    const fetchBlog = () => {
        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blog", { blog_id })
            .then(({ data: { blog } }) => {
                setBlog(blog);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    useEffect(() => {
        fetchBlog();
    }, []);

    return <h1>This is a blog page for {blog.title}</h1>;
};

export default BlogPage;
