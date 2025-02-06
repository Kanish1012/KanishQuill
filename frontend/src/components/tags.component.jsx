import { useContext } from "react";
import { EditorContext } from "../pages/editor.pages";

const Tag = ({ tag, tagIndex }) => {
    let {
        blog,
        blog: { tags },
        setBlog,
    } = useContext(EditorContext);

    // Enable editing mode for a tag when clicked
    const addEditable = (e) => {
        e.target.setAttribute("contentEditable", true);
        e.target.focus();
    };

    // Handle tag edit and update state when Enter (13) or Comma (188) is pressed
    const handleTagEdit = (e) => {
        if (e.keyCode == 13 || e.keyCode == 188) {
            e.preventDefault();
            let currentTag = e.target.innerText.trim(); // Trim spaces
            tags[tagIndex] = currentTag;
            setBlog({ ...blog, tags });

            e.target.setAttribute("contentEditable", false); // Disable editing mode
        }
    };

    // Handle tag deletion from the tags array
    const handleTagDelete = () => {
        tags = tags.filter((t) => t !== tag);
        setBlog({ ...blog, tags });
    };

    return (
        <div className="relative p-2 mt-2 mr-2 px-5 bg-white rounded-full inline-block hover:bg-opacity-50 pr-10">
            {/* Tag text, editable when clicked */}
            <p
                className="outline-none"
                onKeyDown={handleTagEdit}
                onClick={addEditable}
            >
                {tag}
            </p>

            {/* Delete button for the tag */}
            <button
                className="mt-[2px] rounded-full absolute right-3 top-1/2 -translate-y-1/2"
                onClick={handleTagDelete}
            >
                <i className="fi fi-br-cross text-sm pointer-events-none" />
            </button>
        </div>
    );
};

export default Tag;
