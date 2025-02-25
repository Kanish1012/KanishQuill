// Component to render an image with an optional caption
const Img = ({ url, caption }) => {
    return (
        <div>
            <img src={url} />
            {caption.length ? ( // Render caption only if it exists
                <p className="w-full text-center my-3 md:mb-12 text-base text-dark-grey">
                    {caption}
                </p>
            ) : (
                ""
            )}
        </div>
    );
};

// Component to render a blockquote with an optional caption
const Quote = ({ quote, caption }) => {
    return (
        <div className="bg-purple/10 p-3 pl-5 border-l-4 border-purple">
            <p className="text-xl leading-10 md:text-2xl">{quote}</p>
            {caption.length ? ( // Render caption only if it exists
                <p className="w-full text-purple text-base">{caption}</p>
            ) : (
                ""
            )}
        </div>
    );
};

// Component to render an ordered or unordered list
const List = ({ style, items }) => {
    return (
        <ol
            className={`pl-5 ${
                style == "ordered" ? "list-decimal" : "list-disc"
            }`}
        >
            {items.map((listItem, i) => {
                return (
                    <li
                        key={i}
                        className="my-4"
                        dangerouslySetInnerHTML={{ __html: listItem }} // Render HTML content safely
                    ></li>
                );
            })}
        </ol>
    );
};

// Component to render different types of blog content blocks
const BlogContent = ({ block }) => {
    let { type, data } = block;

    // Render paragraph
    if (type == "paragraph") {
        return <p dangerouslySetInnerHTML={{ __html: data.text }}></p>;
    }

    // Render headers (h2 or h3 based on level)
    if (type == "header") {
        if (data.level == 3) {
            return (
                <h3
                    dangerouslySetInnerHTML={{ __html: data.text }}
                    className="text-3xl font-semibold"
                ></h3>
            );
        }
        return (
            <h2
                dangerouslySetInnerHTML={{ __html: data.text }}
                className="text-4xl font-semibold"
            ></h2>
        );
    }

    // Render image block
    if (type == "image") {
        return <Img url={data.file.url} caption={data.caption} />;
    }

    // Render quote block
    if (type == "quote") {
        return <Quote quote={data.text} caption={data.caption} />;
    }

    // Render list block
    if (type == "list") {
        return <List style={data.style} items={data.items} />;
    }
};

export default BlogContent;
