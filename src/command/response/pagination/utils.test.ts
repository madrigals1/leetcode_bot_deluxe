import { InlineKeyboard } from "grammy";
import { describe, expect, it, vi } from "vitest";
import { PaginationRegistry } from "./registry";
import {
  buildKeyboard,
  buildNavRow,
  defaultFooter,
  registerPaginationCallback,
  totalPages,
} from "./utils";

describe("pagination utils", () => {
  it("builds a keyboard from item rows and an extra keyboard", () => {
    const rows = [[{ text: "a", callback_data: "x" }]];
    const extra = new InlineKeyboard().text("b", "y");

    const keyboard = buildKeyboard(rows, extra);
    expect(keyboard.inline_keyboard).toEqual([
      [{ text: "a", callback_data: "x" }],
      [{ text: "b", callback_data: "y" }],
    ]);
  });

  it("builds a keyboard from only item rows", () => {
    const keyboard = buildKeyboard([[{ text: "a", callback_data: "x" }]]);
    expect(keyboard.inline_keyboard).toEqual([[{ text: "a", callback_data: "x" }]]);
  });

  it("builds a keyboard from only an extra keyboard", () => {
    const keyboard = buildKeyboard(undefined, new InlineKeyboard().text("b", "y"));
    expect(keyboard.inline_keyboard).toEqual([[{ text: "b", callback_data: "y" }]]);
  });

  it("builds an empty keyboard", () => {
    expect(buildKeyboard().inline_keyboard).toEqual([]);
  });

  it("computes total pages", () => {
    expect(totalPages(5, 10)).toBe(1);
    expect(totalPages(10, 10)).toBe(1);
    expect(totalPages(11, 10)).toBe(2);
  });

  it("renders the default footer", () => {
    expect(defaultFooter(2, 25, 10)).toBe("Page 2 of 3");
  });

  it("builds a nav row with previous and next", () => {
    expect(buildNavRow(2, true, "rating")).toEqual([
      { text: "⬅️ Previous", callback_data: "rating_page:1" },
      { text: "Next ➡️", callback_data: "rating_page:3" },
    ]);
  });

  it("builds a nav row without previous on the first page", () => {
    expect(buildNavRow(1, true, "rating")).toEqual([
      { text: "Next ➡️", callback_data: "rating_page:2" },
    ]);
  });

  it("builds a nav row without next on the last page", () => {
    expect(buildNavRow(2, false, "rating")).toEqual([
      { text: "⬅️ Previous", callback_data: "rating_page:1" },
    ]);
  });

  it("registers a pagination handler", () => {
    const registerSpy = vi.spyOn(PaginationRegistry, "registerHandler")
      .mockImplementation(() => {});

    registerPaginationCallback({
      name: "demo",
      fetchPage: vi.fn(),
      renderPage: vi.fn(),
      defaultPageSize: 5,
      reply: vi.fn(),
    });

    expect(registerSpy).toHaveBeenCalledWith(
      "demo",
      expect.objectContaining({ defaultPageSize: 5 }),
    );
    registerSpy.mockRestore();
  });
});