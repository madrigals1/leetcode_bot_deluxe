import { Context } from "grammy";
import { describe, expect, it, vi } from "vitest";
import { DataNotFoundError } from "@/errors";
import { LbContext } from "@/utils/context";
import { makeFakeContext } from "../../../../tests/helpers/makeFakeContext";
import { renderFirstPage } from "./text";

function makeLb() {
  return new LbContext(makeFakeContext() as unknown as Context);
}

interface Row {
  username: string;
}

function page(results: Row[], count?: number) {
  return {
    count: count ?? results.length,
    next: null,
    previous: null,
    results,
  };
}

describe("renderFirstPage", () => {
  it("renders the header, items, footer and a next nav button", async () => {
    const lb = makeLb();
    const reply = vi.fn();
    const fetchPage = vi.fn(async () => page(
      [{ username: "alice" }, { username: "bob" }],
      5,
    ));

    await renderFirstPage({
      lbCtx: lb,
      response: {
        type: "paginatedText",
        name: "rating",
        header: "Rating  🏆",
        fetchPage,
        formatItem: (item: Row, index: number) =>
          `${index + 1}. <b>${item.username}</b>`,
      },
      pageSize: 2,
      reply,
    });

    expect(fetchPage).toHaveBeenCalledWith(1, lb);
    const [sent, options] = reply.mock.calls[0] as
      [string, { reply_markup: { inline_keyboard: unknown[][] } }];

    expect(sent).toContain("Rating  🏆");
    expect(sent).toContain("1. <b>alice</b>");
    expect(sent).toContain("Page 1 of 3");
    expect(options.reply_markup.inline_keyboard).toEqual([
      [{ text: "Next ➡️", callback_data: "rating_page:2" }],
    ]);
  });

  it("renders a single page without nav buttons", async () => {
    const lb = makeLb();
    const reply = vi.fn();
    const fetchPage = vi.fn(async () => page([{ username: "alice" }], 1));

    await renderFirstPage({
      lbCtx: lb,
      response: {
        type: "paginatedText",
        name: "rating",
        header: "Rating",
        fetchPage,
        formatItem: (item: Row, index: number) => `${index + 1}. ${item.username}`,
      },
      pageSize: 10,
      reply,
    });

    const [, options] = reply.mock.calls[0] as
      [string, { reply_markup: { inline_keyboard: unknown[][] } }];
    expect(options.reply_markup.inline_keyboard).toEqual([[]]);
  });

  it("throws DataNotFoundError when there are no results", async () => {
    const fetchPage = vi.fn(async () => page([]));

    await expect(
      renderFirstPage({
        lbCtx: makeLb(),
        response: {
          type: "paginatedText",
          name: "rating",
          header: "Rating",
          fetchPage,
          formatItem: () => "",
        },
        pageSize: 10,
        reply: vi.fn(),
      }),
    ).rejects.toThrow(DataNotFoundError);
  });
});