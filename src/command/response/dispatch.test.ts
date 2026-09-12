import { Context } from "grammy";
import { describe, expect, it, vi } from "vitest";
import { DataNotFoundError } from "@/errors";
import { makeFakeContext } from "../../../tests/helpers/makeFakeContext";
import { LbContext } from "@/utils/context";
import { dispatchResponse } from "./dispatch";

function makeLb() {
  const ctx = makeFakeContext() as ReturnType<typeof makeFakeContext> & {
    api: { editMessageText: ReturnType<typeof vi.fn> };
  };
  ctx.api = { editMessageText: vi.fn() };
  return new LbContext(ctx as unknown as Context);
}

describe("dispatchResponse", () => {
  it("dispatches a text response", async () => {
    const lb = makeLb();
    const reply = vi.fn();
    const replyPhoto = vi.fn();

    await dispatchResponse(lb, { type: "text", text: "hi" }, reply, replyPhoto);

    expect(reply).toHaveBeenCalledWith("hi", { reply_markup: undefined });
    expect(replyPhoto).not.toHaveBeenCalled();
  });

  it("dispatches a photo response", async () => {
    const lb = makeLb();
    const reply = vi.fn();
    const replyPhoto = vi.fn();

    await dispatchResponse(
      lb,
      { type: "photo", photo: "https://x", caption: "cap" },
      reply,
      replyPhoto,
    );

    expect(replyPhoto).toHaveBeenCalledWith("https://x", {
      caption: "cap",
      reply_markup: undefined,
    });
  });

  it("dispatches an editText response via the Telegram API", async () => {
    const lb = makeLb();

    await dispatchResponse(
      lb,
      { type: "editText", text: "updated", message_id: 7 },
      vi.fn(),
      vi.fn(),
    );

    expect((lb.ctx as unknown as { api: { editMessageText: ReturnType<typeof vi.fn> } }).api.editMessageText)
      .toHaveBeenCalledWith(123, 7, "updated", { reply_markup: undefined });
  });

  it("dispatches a paginatedText response", async () => {
    const lb = makeLb();
    const reply = vi.fn();
    const fetchPage = vi.fn(async () => ({
      count: 5,
      next: null,
      previous: null,
      results: [{ username: "alice" }],
    }));

    await dispatchResponse(
      lb,
      {
        type: "paginatedText",
        name: "rating",
        header: "Rating",
        fetchPage,
        formatItem: (item: { username: string }, index: number) =>
          `${index + 1}. ${item.username}`,
        itemsPerPage: 2,
      },
      reply,
      vi.fn(),
    );

    expect(reply).toHaveBeenCalledTimes(1);
    const [sent, options] = reply.mock.calls[0] as [string, { reply_markup: unknown }];
    expect(sent).toContain("Rating");
    expect(sent).toContain("1. alice");
    expect(sent).toContain("Page 1 of 3");
    expect(options.reply_markup).toBeDefined();
  });

  it("dispatches a paginatedText response with the default page size", async () => {
    const lb = makeLb();
    const reply = vi.fn();
    const fetchPage = vi.fn(async () => ({
      count: 1,
      next: null,
      previous: null,
      results: [{ username: "alice" }],
    }));

    await dispatchResponse(
      lb,
      {
        type: "paginatedText",
        name: "rating",
        header: "Rating",
        fetchPage,
        formatItem: () => "x",
      },
      reply,
      vi.fn(),
    );

    const [sent] = reply.mock.calls[0] as [string];
    expect(sent).toContain("Page 1 of 1");
  });

  it("dispatches a paginatedButtons response", async () => {
    const lb = makeLb();
    const reply = vi.fn();
    const fetchPage = vi.fn(async () => ({
      count: 4,
      next: null,
      previous: null,
      results: [
        { username: "a" },
        { username: "b" },
        { username: "c" },
      ],
    }));

    await dispatchResponse(
      lb,
      {
        type: "paginatedButtons",
        name: "remove",
        text: "Pick:",
        fetchPage,
        itemToButton: (item: { username: string }) => ({
          text: item.username,
          callback_data: `command:remove ${item.username}`,
        }),
      },
      reply,
      vi.fn(),
    );

    expect(reply).toHaveBeenCalledTimes(1);
    const [sent, options] = reply.mock.calls[0] as [string, { reply_markup: unknown }];
    expect(sent).toBe("Pick:");
    expect(options.reply_markup).toBeDefined();
  });

  it("propagates DataNotFoundError for empty paginated results", async () => {
    const lb = makeLb();
    const fetchPage = vi.fn(async () => ({
      count: 0,
      next: null,
      previous: null,
      results: [],
    }));

    await expect(
      dispatchResponse(
        lb,
        {
          type: "paginatedText",
          name: "rating",
          header: "Rating",
          fetchPage,
          formatItem: () => "x",
        },
        vi.fn(),
        vi.fn(),
      ),
    ).rejects.toThrow(DataNotFoundError);
  });
});