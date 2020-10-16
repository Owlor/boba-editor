import Quill from "quill";
import { addEmbedOverlay } from "./utils";
import React from "react";
import ReactDOM from "react-dom";
import Spinner from "../Spinner";

const Image = Quill.import("formats/image");
const BlockEmbed = Quill.import("blots/block/embed");
const Icon = Quill.import("ui/icons");

const log = require("debug")("bobapost:styles:block-image");

/**
 * BlockImage is a block node (as opposed to inline) containing a
 * single image. Unlike the classic image type, the block image
 * will take the whole line by default.
 */
class BlockImage extends BlockEmbed {
  static create(
    value:
      | { loadPromise: Promise<string | ArrayBuffer> }
      | { src: string; spoilers?: boolean; width: number; height: number }
  ) {
    const node = super.create();
    const img = document.createElement("IMG");
    img.onload = () => {
      node.removeChild(node.querySelector(".spinner"));
      node.classList.remove("loading");
      if (BlockImage.onLoadCallback) {
        BlockImage.onLoadCallback();
      }
    };
    const src = typeof value === "string" ? value : value["src"];
    log(`Image value:`);
    log(value);
    if (src) {
      img.setAttribute("src", this.sanitize(src));
    }
    if (value["width"] || value["height"]) {
      img.setAttribute("width", `${value["width"]}px`);
      img.setAttribute("height", `${value["height"]}px`);
    }
    node.setAttribute("contenteditable", false);
    node.classList.add("ql-block-image", "ql-embed", "loading");
    img.classList.toggle("spoilers", !!value["spoilers"]);
    addEmbedOverlay(
      node,
      {
        onClose: () => {
          BlockImage.onRemoveRequest?.(node);
        },
        onMarkSpoilers: (node, spoilers) => {
          if (spoilers) {
            node.setAttribute("spoilers", "true");
            img.classList.add("spoilers");
          } else {
            node.removeAttribute("spoilers");
            img.classList.remove("spoilers");
          }
        },
      },
      {
        isSpoilers: !!value["spoilers"],
      }
    );
    node.appendChild(img);

    if (!!value["spoilers"]) {
      node.addEventListener("click", () => {
        node.classList.toggle("show-spoilers");
      });
    }

    const spinnerNode = document.createElement("div");
    spinnerNode.classList.add("spinner");
    ReactDOM.render(React.createElement(Spinner, {}, null), spinnerNode);
    node.appendChild(spinnerNode);
    if (value["loadPromise"]) {
      (value["loadPromise"] as Promise<string | ArrayBuffer>)
        .then((src) => {
          img.setAttribute("src", this.sanitize(src));
        })
        .catch(() => {
          node.removeChild(node.querySelector(".spinner"));
          node.classList.add("error");
          node.classList.remove("loading");
        });
    }

    return node;
  }

  static sanitize(src: string | ArrayBuffer) {
    return Image.sanitize(src);
  }

  static setOnLoadCallback(callback: () => void) {
    BlockImage.onLoadCallback = callback;
  }

  static value(domNode: HTMLDivElement) {
    const img = domNode.querySelector("img");
    if (!img) {
      return null;
    }
    const spoilers = domNode.getAttribute("spoilers");
    return {
      src: img.getAttribute("src"),
      spoilers: !!spoilers,
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  }
}

BlockImage.blotName = "block-image";
BlockImage.tagName = "DIV";
BlockImage.className = "block-image-class";

Icon["block-image"] = Quill.import("ui/icons")["image"];

export default BlockImage;
