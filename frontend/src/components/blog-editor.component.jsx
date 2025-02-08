import { Link } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanenr from "../imgs/blog banner.png";
import { uploadImage } from "../common/aws";
import { useContext, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";

const BlogEditor = () => {
    // Destructure necessary variables and functions from context
    let {
        blog,
        blog: { title, content, banner, tags, des },
        setBlog,
        textEditor,
        setTextEditor,
        setEditorState,
    } = useContext(EditorContext);

    // Initialize the text editor on component mount
    useEffect(() => {
        setTextEditor(
            new EditorJS({
                holder: "textEditor",
                data: content,
                tools: tools,
                placeholder: "Let's write an awesome story",
            })
        );
    }, []);

    // Handle banner image upload
    const handleBannerUpload = (e) => {
        let img = e.target.files[0];
        if (img) {
            let loadingToast = toast.loading("Uploading...");
            uploadImage(img)
                .then((url) => {
                    if (url) {
                        toast.dismiss(loadingToast);
                        toast.success("Uploaded 👍");
                        setBlog({ ...blog, banner: url });
                    }
                })
                .catch((err) => {
                    toast.dismiss(loadingToast);
                    return toast.error(err);
                });
        }
    };

    // Prevent default behavior when Enter key is pressed in the title input
    const handleTitleKeyDown = (e) => {
        if (e.keyCode === 13) {
            e.preventDefault();
        }
    };

    // Dynamically adjust the height of the title input and update the blog state
    const handleTitleChange = (e) => {
        let input = e.target;
        input.style.height = "auto";
        input.style.height = input.scrollHeight + "px";
        setBlog({ ...blog, title: input.value });
    };

    // Replace the banner with a default image if loading fails
    const handleError = (e) => {
        let img = e.target;
        img.src = defaultBanenr;
    };

    // Handle the Publish button click event
    const handlePublishEvent = () => {
        if (!banner.length) {
            return toast.error("Please upload a banner");
        }

        if (!title.length) {
            return toast.error("Please enter a Blog title");
        }

        if (textEditor.isReady) {
            textEditor
                .save()
                .then((data) => {
                    if (data.blocks.length) {
                        setBlog({ ...blog, content: data });
                        setEditorState("publish");
                    } else {
                        return toast.error("Please enter some content");
                    }
                })
                .catch((err) => {
                    return toast.error(err);
                });
        }
    };

    return (
        <>
            {/* Navigation bar with logo, title, and buttons */}
            <nav className="navbar">
                <Link to="/" className="flex-none w-10">
                    <img src={logo} />
                </Link>
                <p className="max-md:hidden text-black line-clamp-1 w-full">
                    {title.length ? title : "New Blog"}
                </p>

                <div className="flex gap-4 ml-auto">
                    <button
                        className="btn-dark py-2"
                        onClick={handlePublishEvent}
                    >
                        Publish
                    </button>
                    <button className="btn-light py-2">Save draft</button>
                </div>
            </nav>
            <Toaster />

            {/* Main content section */}
            <AnimationWrapper>
                <section>
                    <div className="mx-auto max-w-[900px] w-full">
                        {/* Banner image upload section */}
                        <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">
                            <label htmlFor="uploadBanner">
                                <img
                                    src={banner}
                                    className="z-20"
                                    onError={handleError}
                                />
                                <input
                                    id="uploadBanner"
                                    type="file"
                                    accept=".png, .jpg, .jpeg"
                                    hidden
                                    onChange={handleBannerUpload}
                                />
                            </label>
                        </div>

                        {/* Title input area */}
                        <textarea
                            defaultValue={title}
                            placeholder="Blog Title"
                            className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
                            onKeyDown={handleTitleKeyDown}
                            onInput={handleTitleChange}
                        ></textarea>

                        {/* Horizontal separator */}
                        <hr className="w-full opacity-10 my-5" />

                        {/* Text editor container */}
                        <div id="textEditor" className="font-gelasio"></div>
                    </div>
                </section>
            </AnimationWrapper>
        </>
    );
};

export default BlogEditor;
