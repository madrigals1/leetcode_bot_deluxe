import "@/callback/callbacks";
import "../../tests/helpers/makeFakeCallbacks";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BotNotInitializedError, LeetCodeBotError } from "@/errors";
import { CommandRegistry } from "@/command/registry";
import { makeFakeBot } from "../../tests/helpers/makeFakeBot";
import { makeFakeContext } from "../../tests/helpers/makeFakeContext";
import { CallbackRegistry } from "./registry";

const metrics = vi.hoisted(() => ({
  callbacksTotal: { inc: vi.fn() },
}));

vi.mock("@/metrics", () => metrics);

function setBotState(bot: unknown) {
  (CallbackRegistry as unknown as { bot?: unknown }).bot = bot;
}

beforeEach(() => {
  metrics.callbacksTotal.inc.mockReset();
});

describe("CallbackRegistry", () => {
  it("throws BotNotInitializedError when no bot is set", () => {
    const previous = (CallbackRegistry as unknown as { bot?: unknown }).bot;
    setBotState(undefined);
    try {
      expect(() => CallbackRegistry.registerAllCallbacks())
        .toThrow(BotNotInitializedError);
    } finally {
      setBotState(previous);
    }
  });

  it("registers decorated callbacks on the bot", () => {
    const fake = makeFakeBot();
    setBotState(fake.bot);

    CallbackRegistry.registerAllCallbacks();

    for (const action of [
      "^test_success$",
      "^test_domain_error$",
      "^test_generic_error$",
      "test_string_action",
      "^command:(.+)$",
    ]) {
      expect(fake.registeredCallbacks.has(action)).toBe(true);
    }
    expect(fake.callbackQuery).toHaveBeenCalledTimes(5);
  });

  it("runs a successful callback and edits the message", async () => {
    const fake = makeFakeBot();
    setBotState(fake.bot);
    CallbackRegistry.registerAllCallbacks();

    const ctx = makeFakeContext() as ReturnType<typeof makeFakeContext> & {
      editMessageText: ReturnType<typeof vi.fn>;
    };
    await fake.registeredCallbacks.get("^test_success$")(ctx);

    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith(undefined);
    expect(ctx.editMessageText).toHaveBeenCalledWith(
      "done",
      { reply_markup: undefined },
    );
    expect(metrics.callbacksTotal.inc).toHaveBeenCalledWith({
      action: "^test_success$",
    });
  });

  it("edits the message with a domain error message", async () => {
    const fake = makeFakeBot();
    setBotState(fake.bot);
    CallbackRegistry.registerAllCallbacks();

    const ctx = makeFakeContext() as ReturnType<typeof makeFakeContext> & {
      editMessageText: ReturnType<typeof vi.fn>;
    };
    await fake.registeredCallbacks.get("^test_domain_error$")(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith("domain boom");
  });

  it("edits the message with a generic error string", async () => {
    const fake = makeFakeBot();
    setBotState(fake.bot);
    CallbackRegistry.registerAllCallbacks();

    const ctx = makeFakeContext() as ReturnType<typeof makeFakeContext> & {
      editMessageText: ReturnType<typeof vi.fn>;
    };
    await fake.registeredCallbacks.get("^test_generic_error$")(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith("An error occurred.");
  });

  it("runs a callback registered with a literal action", async () => {
    const fake = makeFakeBot();
    setBotState(fake.bot);
    CallbackRegistry.registerAllCallbacks();

    const ctx = makeFakeContext({ chatId: 999 });
    await fake.registeredCallbacks.get("test_string_action")(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith(
      "matched: 999",
      { reply_markup: undefined },
    );
  });

  it("hands the match to the real command-redirect callback", async () => {
    const fake = makeFakeBot();
    setBotState(fake.bot);
    CallbackRegistry.registerAllCallbacks();

    const ctx = makeFakeContext({
      match: ["command:wat", "wat"] as unknown as RegExpMatchArray,
    });
    await fake.registeredCallbacks.get("^command:(.+)$")(ctx);

    expect(ctx.editMessageText).not.toHaveBeenCalled();
  });

  it("edits the message when a redirected command throws a domain error", async () => {
    const name = `boom_${Math.random().toString(36).slice(2)}`;
    CommandRegistry.addCommand({
      name,
      description: "demo",
      originalFn: async () => {
        throw new LeetCodeBotError("decorator boom");
      },
      handler: async () => undefined,
    });

    const fake = makeFakeBot();
    setBotState(fake.bot);
    CallbackRegistry.registerAllCallbacks();

    const ctx = makeFakeContext({
      match: [`command:${name}`, name] as unknown as RegExpMatchArray,
    });
    await fake.registeredCallbacks.get("^command:(.+)$")(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith("decorator boom");
  });

  it("edits the message when a redirected command throws a generic error", async () => {
    const name = `gen_${Math.random().toString(36).slice(2)}`;
    CommandRegistry.addCommand({
      name,
      description: "demo",
      originalFn: async () => {
        throw new Error("boom");
      },
      handler: async () => undefined,
    });

    const fake = makeFakeBot();
    setBotState(fake.bot);
    CallbackRegistry.registerAllCallbacks();

    const ctx = makeFakeContext({
      match: [`command:${name}`, name] as unknown as RegExpMatchArray,
    });
    await fake.registeredCallbacks.get("^command:(.+)$")(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith("An error occurred.");
  });
});