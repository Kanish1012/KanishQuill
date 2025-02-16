import { useParams } from "react-router-dom";
import InPageNavigation from "../components/inpage-navigation.component";
import { useEffect, useState } from "react";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import axios from "axios";
import { filterPaginationData } from "../common/filter-pagination-data";
import UserCard from "../components/usercard.component";

const SearchPage = () => {
    // Get the query parameter from the URL
    let { query } = useParams();

    // State to store blog posts and user data
    let [blogs, setBlog] = useState(null);
    let [users, setUsers] = useState(null);

    // Function to fetch blog posts based on search query
    const searchBlogs = ({ page = 1, create_new_arr = false }) => {
        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {
                query,
                page,
            })
            .then(async ({ data }) => {
                console.log(data.blogs);
                // Format and update blog data with pagination
                let formatedData = await filterPaginationData({
                    state: blogs,
                    data: data.blogs,
                    page,
                    countRoute: "/search-blogs-count",
                    data_to_send: { query },
                    create_new_arr,
                });

                setBlog(formatedData); // Update blog state
            })
            .catch((err) => {
                console.log(err); // Log error if the request fails
            });
    };

    // Function to fetch users based on search query
    const fetchUsers = () => {
        axios
            .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-users", {
                query,
            })
            .then(({ data: { users } }) => {
                setUsers(users); // Update users state
            });
    };

    // Function to reset blog and user state
    const resetState = () => {
        setBlog(null);
        setUsers(null);
    };

    // Effect to run search when query changes
    useEffect(() => {
        resetState(); // Clear previous search data
        searchBlogs({ page: 1, create_new_arr: true }); // Fetch new blog data
        fetchUsers(); // Fetch new user data
    }, [query]); // Trigger effect on query change

    // Component to render user cards or fallback message
    const UserCardWrapper = () => {
        return (
            <>
                {users == null ? (
                    <Loader /> // Show loader while fetching users
                ) : users.length ? (
                    // Map through users and render user cards with animations
                    users.map((user, i) => {
                        return (
                            <AnimationWrapper
                                key={i}
                                transition={{ duration: 1, delay: i * 0.08 }}
                            >
                                <UserCard user={user} />
                            </AnimationWrapper>
                        );
                    })
                ) : (
                    <NoDataMessage message="No user found" /> // Show message if no users found
                )}
            </>
        );
    };

    return (
        <section className="h-cover flex justify-center gap-10">
            <div className="w-full">
                {/* Navigation tabs for search results */}
                <InPageNavigation
                    routes={[
                        `Search results for "${query}"`,
                        "Accounts Matched",
                    ]}
                    defaultHidden={["Accounts Matched"]}
                >
                    <>
                        {blogs == null ? (
                            <Loader /> // Show loader while fetching blogs
                        ) : blogs.results.length ? (
                            // Map through blogs and render blog post cards
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
                                            author={blog.author.personal_info}
                                        />
                                    </AnimationWrapper>
                                );
                            })
                        ) : (
                            <NoDataMessage message="No Blogs Published" /> // Show message if no blogs found
                        )}
                        {/* Button to load more blog posts */}
                        <LoadMoreDataBtn
                            state={blogs}
                            fetchDataFun={searchBlogs}
                        />
                    </>

                    {/* Render user cards */}
                    <UserCardWrapper />
                </InPageNavigation>
            </div>

            {/* Sidebar for user search results (visible on larger screens) */}
            <div className="min-w-[40%] lg:min-w-[350px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
                <h1 className="font-medium text-xl mb-8 ">
                    User related to search <i className="fi fi-rr-user mt-1" />
                </h1>
                <UserCardWrapper />
            </div>
        </section>
    );
};

export default SearchPage;
