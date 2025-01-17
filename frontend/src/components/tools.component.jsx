// importing tools

import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import InlineCode from "@editorjs/inline-code";

import { uploadImage } from "../common/aws";

const uploadImageByUrl = (e) => {
    let link = new Promise((resolve, reject) => {
        try {
            resolve(e);
        } catch {
            reject(err);
        }
    });

    return link.then((url) => {
        return {
            file: { url },
            success: 1,
        };
    });
};

const uploadImageByFile = (e) => {
    return uploadImage(e).then(url=>{
        if(url){
            return{
                file: { url },
                success: 1,
            }
        }
    })
};

export const tools = {
    embed: Embed,
    list: {
        class: List,
        inlineToolbar: true,
    },
    image: {
        class: Image,
        config: {
            uploader: {
                uploadByUrl: uploadImageByUrl,
                uploadByFile: uploadImageByFile,
            },
        },
    },
    header: {
        class: Header,
        config: {
            placeholder: "Type Heading...",
            levels: [3, 4],
            defaultLevel: 3,
        },
    },
    quote: {
        class: Quote,
        inlineToolbar: true,
    },
    code: Code,
    inlineCode: InlineCode,
};
