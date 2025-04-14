import { useState } from "react";

const ManageBlogs = ()=>{
    const[blogs, setBlogs] = useState(null);
    const [drafts, setDrafts] = useState(null);
    const [query, setQuery] = useState("");
    return(
        <h1>Blog mangaement</h1>
    )
}

export default ManageBlogs;