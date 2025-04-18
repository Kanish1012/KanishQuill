import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import { filterPaginationData } from "../common/filter-pagination-data";
import { Toaster } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import NoDataMessage from "../components/nodata.component";
import {
    ManagePublishedBlogCard,
    ManageDraftBlogPost,
} from "../components/manage-blogcard.component";
import LoadMoreDataBtn from "../components/load-more.component";
import { useSearchParams } from "react-router-dom";

const ManageBlogs = () => {
    const [blogs, setBlogs] = useState(null); // State for published blogs
    const [drafts, setDrafts] = useState(null); // State for draft blogs
    const [query, setQuery] = useState(""); // Search query state

    let activeTab = useSearchParams()[0].get('tab')

    // Access token from context
    let {
        userAuth: { access_token },
    } = useContext(UserContext);

    // Fetch blogs or drafts from server
    const getBlogs = ({ page, draft, deletedDocCount = 0 }) => {
        axios
            .post(
                import.meta.env.VITE_SERVER_DOMAIN + "/user-written-blogs",
                { page, draft, query, deletedDocCount },
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                }
            )
            .then(async ({ data }) => {
                // Format and set fetched data
                let formatedData = await filterPaginationData({
                    state: draft ? drafts : blogs,
                    data: data.blogs,
                    page,
                    user: access_token,
                    countRoute: "/user-written-blogs-count",
                    data_to_send: { draft, query },
                });

                if (draft) {
                    setDrafts(formatedData);
                } else {
                    setBlogs(formatedData);
                }
            })
            .catch((err) => {
                console.error("Error fetching blogs:", err);
            });
    };

    // Initial data fetch on component mount
    useEffect(() => {
        if (access_token) {
            if (blogs === null) {
                getBlogs({ page: 1, draft: false });
            }
            if (drafts === null) {
                getBlogs({ page: 1, draft: true });
            }
        }
    }, [access_token, blogs, drafts, query]);

    // Handle search input on key press
    const handleSearch = (e) => {
        let searchQuery = e.target.value;
        setQuery(searchQuery);

        // Trigger search on Enter key
        if (e.key === "Enter" && searchQuery.length) {
            setBlogs(null);
            setDrafts(null);
        }
    };

    // Reset search on empty input
    const handleChange = (e) => {
        if (!e.target.value.length) {
            setQuery("");
            setBlogs(null);
            setDrafts(null);
        }
    };

    return (
        <>
            <h1 className="max-md:hidden">Manage Blogs</h1>
            <Toaster />

            {/* Search Input */}
            <div className="relative max-md:mt-5 md:mt-8 mb-10">
                <input
                    type="search"
                    className="w-full bg-grey p-4 pl-12 pr-6 rounded-full placeholder:text-dark-grey"
                    placeholder="Search Blogs"
                    onChange={handleChange}
                    onKeyDown={handleSearch}
                />
                <i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey"></i>
            </div>

            {/* Tab Navigation for Published and Drafts */}
            <InPageNavigation routes={["Published Blogs", "Drafts"]} defaultActiveIndex={activeTab != 'draft' ? 0 : 1}>
                {/* Published Blogs Section */}
                {blogs == null ? (
                    <Loader />
                ) : blogs.results.length ? (
                    <>
                        {blogs.results.map((blog, i) => (
                            <AnimationWrapper
                                key={i}
                                transition={{ delay: i * 0.04 }}
                            >
                                <ManagePublishedBlogCard
                                    blog={{
                                        ...blog,
                                        index: i,
                                        setStateFunc: setBlogs,
                                    }}
                                />
                            </AnimationWrapper>
                        ))}
                        <LoadMoreDataBtn
                            state={blogs}
                            fetchDataFun={getBlogs}
                            additionalParam={{
                                draft: false,
                                deletedDocCount: blogs.deletedDocCount,
                            }}
                        />
                    </>
                ) : (
                    <NoDataMessage message="No published blogs" />
                )}

                {/* Draft Blogs Section */}
                {drafts == null ? (
                    <Loader />
                ) : drafts.results.length ? (
                    <>
                        {drafts.results.map((blog, i) => (
                            <AnimationWrapper
                                key={i}
                                transition={{ delay: i * 0.04 }}
                            >
                                <ManageDraftBlogPost
                                    blog={{
                                        ...blog,
                                        index: i,
                                        setStateFunc: setDrafts,
                                    }}
                                />
                            </AnimationWrapper>
                        ))}
                        <LoadMoreDataBtn
                            state={drafts}
                            fetchDataFun={getBlogs}
                            additionalParam={{
                                draft: true,
                                deletedDocCount: drafts.deletedDocCount,
                            }}
                        />
                    </>
                ) : (
                    <NoDataMessage message="No Draft blogs" />
                )}
            </InPageNavigation>
        </>
    );
};

export default ManageBlogs;
