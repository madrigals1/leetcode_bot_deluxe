import "@/callback";
import { describe, expect, it } from "vitest";
import {
  commandRedirect,
  editButtons,
  editPhoto,
  editText,
} from "./shortcuts";

describe("callback response shortcuts", () => {
  it("editText", () => {
    expect(editText("new")).toEqual({ type: "editText", text: "new" });
  });

  it("editButtons", () => {
    expect(editButtons({ text: "new", buttons: undefined })).toEqual({
      type: "editText",
      text: "new",
      buttons: undefined,
    });
  });

  it("editPhoto", () => {
    expect(editPhoto({ photo: "https://x", caption: "cap" })).toEqual({
      type: "editPhoto",
      photo: "https://x",
      caption: "cap",
    });
  });

  it("commandRedirect", () => {
    expect(commandRedirect("profile alice")).toEqual({
      type: "commandRedirect",
      command: "profile alice",
    });
  });
});