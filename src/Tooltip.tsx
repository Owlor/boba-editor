import React, { Component, forwardRef } from "react";
const TenorKeyboard = require("./TenorKeyboard").default;
import classNames from "classnames";

// @ts-ignore
import GifImage from "./img/gif.svg";

import Quill from "quill";
let QuillModule: typeof Quill;
if (typeof window !== "undefined") {
  QuillModule = require("quill") as typeof Quill;
}

class Tooltip extends Component<{
  show: boolean;
  top: number | undefined;
  right: number | undefined;
  onInsertEmbed: ({}: { type: string; embed: any }) => void;
  preventUpdate: (shouldPrevent: boolean) => void;
}> {
  state = {
    tenorOpen: false,
  };

  imageButton = React.createRef<HTMLButtonElement>();
  tweetInput = React.createRef<HTMLButtonElement>();
  gifButton = React.createRef<HTMLButtonElement>();
  imageInput = React.createRef<HTMLInputElement>();

  componentDidMount() {
    if (!this.imageButton.current || !this.tweetInput.current) {
      return;
    }
    this.imageButton.current.innerHTML = QuillModule.import("ui/icons")[
      "image"
    ];
    this.tweetInput.current.innerHTML = QuillModule.import("ui/icons")["tweet"];
  }

  render() {
    return (
      <>
        <div className="ql-bubble">
          <div
            className={classNames("tooltip ql-tooltip ql-toolbar", {
              hidden: !this.props.show,
            })}
            style={{
              top: `${this.props.top}px`,
              right: `${this.props.right}px`,
            }}
          >
            <button
              className="ql-image"
              ref={this.imageButton as any}
              onClick={() => {
                this.imageInput.current?.click();
              }}
            />
            <ImageLoader
              ref={this.imageInput}
              onImageLoaded={(image) => {
                this.props.onInsertEmbed({ type: "block-image", embed: image });
              }}
            />
            <button
              className="ql-image-gif ql-image"
              ref={this.gifButton}
              onClick={(e) => {
                this.props.preventUpdate(true);
                e.stopPropagation();
                this.setState({ tenorOpen: true });
              }}
            >
              <GifImage key="gif_image" />
            </button>
            <button
              className="ql-tweet"
              ref={this.tweetInput}
              onClick={() => {
                // TODO: make a prettier input
                let url = prompt("Gimme a tweet url");
                if (url) {
                  this.props.onInsertEmbed({ type: "tweet", embed: url });
                }
              }}
            />
            <TenorKeyboard
              isOpen={this.state.tenorOpen}
              target={this.gifButton}
              onClose={(result: any) => {
                this.props.preventUpdate(false);
                if (result) {
                  this.props.onInsertEmbed({
                    type: "block-image",
                    embed: result.media[0].gif.url,
                  });
                }
                this.setState({ tenorOpen: false });
              }}
            />
          </div>
        </div>
        <style jsx>{`
          .tooltip {
            position: absolute;
            z-index: 5;
            height: 25px;
            padding: 0 5px;
            display: block;
            transform: translateY(-5px);
          }
          .tooltip.hidden {
            display: none;
          }
        `}</style>
      </>
    );
  }
}

const ImageLoader = forwardRef<
  HTMLInputElement,
  { onImageLoaded: (img: string | ArrayBuffer) => void }
>((props, ref) => {
  return (
    <input
      ref={ref}
      className="ql-image"
      type="file"
      accept="image/png, image/gif, image/jpeg, image/bmp, image/x-icon"
      onChange={(e) => {
        const fileInput = e.target;
        if (fileInput.files != null && fileInput.files[0] != null) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (!e.target?.result) {
              return;
            }
            props.onImageLoaded(e.target.result);
            fileInput.value = "";
          };
          reader.readAsDataURL(fileInput.files[0]);
        }
      }}
    />
  );
});

export default Tooltip;
