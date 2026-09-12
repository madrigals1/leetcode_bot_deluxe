import "@/command";
import { InlineKeyboard } from "grammy";
import { describe, expect, it } from "vitest";
import {
  buttons,
  editText,
  errorText,
  paginatedButtons,
  paginatedText,
  photo,
  successText,
  text,
} from "./shortcuts";

const fetchPage = (async () => null) as never;
const formatItem = (() => "") as never;
const itemToButton = (() => ({ text: "" })) as never;

describe("command response shortcuts", () => {
  it("text", () => {
    expect(text("hi")).toEqual({ type: "text", text: "hi" });
  });

  it("errorText", () => {
    expect(errorText("oops")).toEqual({ type: "text", text: "❗ oops" });
  });

  it("successText", () => {
    expect(successText("done")).toEqual({ type: "text", text: "✅ done" });
  });

  it("buttons", () => {
    expect(buttons({ text: "hi", buttons: undefined })).toEqual({
      type: "text",
      text: "hi",
      buttons: undefined,
    });
  });

  it("editText", () => {
    expect(editText({ text: "new", message_id: 3, buttons: undefined })).toEqual({
      type: "editText",
      text: "new",
      message_id: 3,
      buttons: undefined,
    });
  });

  it("photo", () => {
    expect(photo({ photo: "https://x", caption: "cap" })).toEqual({
      type: "photo",
      photo: "https://x",
      caption: "cap",
    });
  });

  it("paginatedText", () => {
    const keyboard = new InlineKeyboard().text("k", "data");
    const r = paginatedText({
      name: "rating",
      header: "Rating",
      fetchPage,
      formatItem,
      buttons: keyboard,
    });
    expect(r.type).toBe("paginatedText");
    expect(r.name).toBe("rating");
    expect(r.header).toBe("Rating");
    expect(r.buttons).toBe(keyboard);
  });

  it("paginatedButtons", () => {
    const r = paginatedButtons({
      name: "remove",
      fetchPage,
      itemToButton,
      buttonsPerRow: 2,
      itemsPerPage: 4,
      text: "Pick",
    });
    expect(r.type).toBe("paginatedButtons");
    expect(r.name).toBe("remove");
    expect(r.buttonsPerRow).toBe(2);
    expect(r.itemsPerPage).toBe(4);
    expect(r.text).toBe("Pick");
  });
});