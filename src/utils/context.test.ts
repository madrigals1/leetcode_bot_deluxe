import { describe, expect, it } from "vitest";
import {
  ChatIdNotFoundError,
  MatchNotFoundError,
  TelegramUsernameNotFoundError,
} from "@/errors";
import { makeFakeContext } from "../../tests/helpers/makeFakeContext";
import { LbContext } from "./context";

describe("LbContext", () => {
  it("exposes the chat id", () => {
    const lb = new LbContext(makeFakeContext({ chatId: 42 }));
    expect(lb.chatId).toBe(42);
  });

  it("throws when the chat id is missing", () => {
    const ctx = makeFakeContext() as ReturnType<typeof makeFakeContext> & {
      chat?: unknown;
    };
    delete ctx.chat;
    expect(() => new LbContext(ctx)).toThrow(ChatIdNotFoundError);
  });

  it("exposes the telegram username", () => {
    const lb = new LbContext(makeFakeContext({ telegramUsername: "bob" }));
    expect(lb.telegramUsername).toBe("bob");
  });

  it("throws when the telegram username is missing", () => {
    const lb = new LbContext(makeFakeContext({ telegramUsername: "" }));
    expect(() => lb.telegramUsername).toThrow(TelegramUsernameNotFoundError);
  });

  it("exposes the match", () => {
    const match = ["command:profile alice", "alice"] as unknown as RegExpMatchArray;
    const lb = new LbContext(makeFakeContext({ match }));
    expect(lb.match).toEqual(["command:profile alice", "alice"]);
  });

  it("throws when the match is missing", () => {
    const lb = new LbContext(makeFakeContext({ match: null }));
    expect(() => lb.match).toThrow(MatchNotFoundError);
  });

  it("delegates reply", () => {
    const ctx = makeFakeContext();
    const lb = new LbContext(ctx);
    lb.reply("hi");
    expect(ctx.reply).toHaveBeenCalledWith("hi", undefined);
  });

  it("delegates replyWithPhoto", () => {
    const ctx = makeFakeContext();
    const lb = new LbContext(ctx);
    lb.replyWithPhoto("https://img", { caption: "cap" });
    expect(ctx.replyWithPhoto).toHaveBeenCalledWith("https://img", {
      caption: "cap",
    });
  });

  it("delegates answerCallbackQuery", () => {
    const ctx = makeFakeContext();
    const lb = new LbContext(ctx);
    lb.answerCallbackQuery("done");
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith("done");
  });

  it("delegates editMessageText", () => {
    const ctx = makeFakeContext();
    const lb = new LbContext(ctx);
    lb.editMessageText("new");
    expect(ctx.editMessageText).toHaveBeenCalledWith("new", undefined);
  });

  it("delegates editPhoto to editMessageMedia", () => {
    const ctx = makeFakeContext();
    const lb = new LbContext(ctx);
    lb.editPhoto("https://img", { caption: "cap" });
    expect(ctx.editMessageMedia).toHaveBeenCalledWith(
      { type: "photo", media: "https://img", caption: "cap" },
      { reply_markup: undefined },
    );
  });
});