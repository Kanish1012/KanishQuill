import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { getDay } from "../common/date";
import BlogInteraction from "../components/blog-interaction.component";
import BlogPostCard from "../components/blog-post.component";
import BlogContent from "../components/blog-content.component";

// Initial structure for a blog object
export const blogStructure = {
    title: "",
    banner: "",
    author: { personal_info: {} },
    des: "",
    content: [],
    publishedAt: "",
};

// Context to share blog data within the component tree
export const BlogContext = createContext({});

const BlogPage = () => {
    let { blog_id } = useParams(); // Get blog ID from the URL parameters
    const [blog, setBlog] = useState(blogStructure); // State for the current blog
    const [similarBlogs, setSimilarBlogs] = useState(null); // State for similar blogs
    const [loading, setLoading] = useState(true); // Loading state
    const [isLikedByUser, setIsLikedByUser] = useState(false); // State for user's like status

    // Destructure blog data for easier access
    let {
        title,
        content,
        banner,
        author: {
            personal_info: { fullname, username: author_username, profile_img },
        },
        publishedAt,
    } = blog;

    // Fetches the blog data and similar blogs based on the first tag
    const fetchBlog = () => {
        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blog", { blog_id })
            .then(({ data: { blog } }) => {
                setBlog(blog);

                // Fetch similar blogs using the first tag of the current blog
                axios
                    .post(
                        import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs",
                        {
                            tag: blog.tags[0],
                            limit: 6,
                            eliminate_blog: blog_id,
                        }
                    )
                    .then(({ data }) => {
                        setSimilarBlogs(data.blogs);
                    });

                setLoading(false);
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });
    };

    // Reset states and fetch blog data when blog_id changes
    useEffect(() => {
        resetStates();
        fetchBlog();
    }, [blog_id]);

    // Resets states before fetching new blog data
    const resetStates = () => {
        setBlog(blogStructure);
        setSimilarBlogs(null);
        setLoading(true);
    };

    return (
        <AnimationWrapper>
            {loading ? (
                <Loader />
            ) : (
                <BlogContext.Provider
                    value={{ blog, setBlog, isLikedByUser, setIsLikedByUser }}
                >
                    <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
                        {/* Blog banner image */}
                        <img src={banner} className="aspect-video" />

                        {/* Blog title and author details */}
                        <div className="mt-12">
                            <h2>{title}</h2>

                            <div className="flex max-sm:flex-col justify-between my-8">
                                <div className="flex gap-5 items-start">
                                    {/* Author profile image */}
                                    <img
                                        src={profile_img}
                                        className="w-12 h-12 rounded-full"
                                    />

                                    {/* Author name and username */}
                                    <p className="capitalize">
                                        {fullname}
                                        <br />@
                                        <Link
                                            to={`/user/${author_username}`}
                                            className="underline"
                                        >
                                            {author_username}
                                        </Link>
                                    </p>
                                </div>

                                {/* Published date */}
                                <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">
                                    Published on {getDay(publishedAt)}
                                </p>
                            </div>
                        </div>

                        {/* Blog interaction component (likes, comments, etc.) */}
                        <BlogInteraction />

                        {/* Blog content */}
                        <div className="my-12 font-gelasio blog-page-content">
                            {content[0].blocks.map((block, i) => {
                                return (
                                    <div key={i} className="my-4 md:my-8">
                                        <BlogContent block={block} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Blog interaction component repeated after content */}
                        <BlogInteraction />

                        {/* Similar blogs section */}
                        {similarBlogs != null && similarBlogs.length ? (
                            <>
                                <h1 className="text-2xl mt-14 mb-10 font-medium">
                                    Similar Blogs
                                </h1>
                                {similarBlogs.map((blog, i) => {
                                    let {
                                        author: { personal_info },
                                    } = blog;
                                    return (
                                        <AnimationWrapper
                                            key={i}
                                            transition={{
                                                duration: 1,
                                                delay: i * 0.08,
                                            }}
                                        >
                                            <BlogPostCard
                                                content={blog}
                                                author={personal_info}
                                            />
                                        </AnimationWrapper>
                                    );
                                })}
                            </>
                        ) : (
                            ""
                        )}
                    </div>
                </BlogContext.Provider>
            )}
        </AnimationWrapper>
    );
};

export default BlogPage;
