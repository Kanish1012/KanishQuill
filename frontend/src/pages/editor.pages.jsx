import { createContext, useContext, useState, useEffect } from "react";
import { UserContext } from "../App";
import { Navigate } from "react-router-dom";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";

const blogStructure = {
    title: "",
    banner: "",
    content: [],
    tags: [],
    des: "",
    author: { personal_info: {} },
};

export const EditorContext = createContext({});

const Editor = () => {
    const [blog, setBlog] = useState(blogStructure);
    const [editorState, setEditorState] = useState("editor");
    const [textEditor, setTextEditor] = useState({ isReady: false });
    const [loading, setLoading] = useState(true); // Prevents premature redirection

    let { userAuth } = useContext(UserContext);

    useEffect(() => {
        setLoading(false); // Ensures state updates before rendering
    }, []);

    if (loading) return <p>Loading...</p>; // Prevent unnecessary redirects

    return (
        <EditorContext.Provider
            value={{
                blog,
                setBlog,
                editorState,
                setEditorState,
                textEditor,
                setTextEditor,
            }}
        >
            {userAuth.access_token === null ? (
                <Navigate to="/signin" />
            ) : editorState === "editor" ? (
                <BlogEditor />
            ) : (
                <PublishForm />
            )}
        </EditorContext.Provider>
    );
};

export default Editor;
