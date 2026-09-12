import { Context } from "grammy";
import { describe, expect, it, vi } from "vitest";
import { DataNotFoundError } from "@/errors";
import { LbContext } from "@/utils/context";
import { makeFakeContext } from "../../../../tests/helpers/makeFakeContext";
import { renderFirstButtonsPage } from "./button";

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

function response(overrides: Partial<Parameters<typeof response>[0]> = {}) {
  return {
    type: "paginatedButtons" as const,
    name: "compare",
    text: "Select:",
    fetchPage: vi.fn(),
    itemToButton: (item: Row) => ({
      text: item.username,
      callback_data: `command:compare ${item.username}`,
    }),
    ...overrides,
  };
}

describe("renderFirstButtonsPage", () => {
  it("chunks items into rows and appends the nav row", async () => {
    const lb = makeLb();
    const reply = vi.fn();
    const fetchPage = vi.fn(async () => page(
      [{ username: "a" }, { username: "b" }, { username: "c" }],
      5,
    ));

    await renderFirstButtonsPage({
      lbCtx: lb,
      response: response({ fetchPage }),
      pageSize: 2,
      buttonsPerRow: 2,
      reply,
    });

    const [sent, options] = reply.mock.calls[0] as
      [string, { reply_markup: { inline_keyboard: unknown[][] } }];
    expect(sent).toBe("Select:");
    expect(options.reply_markup.inline_keyboard).toEqual([
      [
        { text: "a", callback_data: "command:compare a" },
        { text: "b", callback_data: "command:compare b" },
      ],
      [{ text: "c", callback_data: "command:compare c" }],
      [{ text: "Next ➡️", callback_data: "compare_page:2" }],
    ]);
  });

  it("uses the default text, page size and buttons-per-row", async () => {
    const lb = makeLb();
    const reply = vi.fn();
    const fetchPage = vi.fn(async () => page(
      [{ username: "a" }, { username: "b" }, { username: "c" }, { username: "d" }],
    ));

    await renderFirstButtonsPage({
      lbCtx: lb,
      response: response({ fetchPage, text: undefined }),
      pageSize: 4,
      reply,
    });

    const [sent, options] = reply.mock.calls[0] as
      [string, { reply_markup: { inline_keyboard: unknown[][] } }];
    expect(sent).toBe("Select an item:");
    expect(options.reply_markup.inline_keyboard).toEqual([
      [
        { text: "a", callback_data: "command:compare a" },
        { text: "b", callback_data: "command:compare b" },
      ],
      [
        { text: "c", callback_data: "command:compare c" },
        { text: "d", callback_data: "command:compare d" },
      ],
      [],
    ]);
  });

  it("throws DataNotFoundError when there are no results", async () => {
    const fetchPage = vi.fn(async () => page([]));

    await expect(
      renderFirstButtonsPage({
        lbCtx: makeLb(),
        response: response({ fetchPage }),
        pageSize: 2,
        reply: vi.fn(),
      }),
    ).rejects.toThrow(DataNotFoundError);
  });
});