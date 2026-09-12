import { beforeEach, describe, expect, it, vi } from "vitest";
import { BotNotInitializedError, LeetCodeBotError } from "@/errors";
import { makeFakeBot } from "../../tests/helpers/makeFakeBot";
import { makeFakeContext } from "../../tests/helpers/makeFakeContext";
import { CommandRegistry } from "./registry";

const metrics = vi.hoisted(() => ({
  commandsTotal: { inc: vi.fn() },
  commandsErrorsTotal: { inc: vi.fn() },
  commandDurationSeconds: { startTimer: vi.fn(() => vi.fn()) },
}));

vi.mock("@/metrics", () => metrics);

function setBotState(bot: unknown) {
  (CommandRegistry as unknown as { bot?: unknown }).bot = bot;
}

function addCommand(name: string, handler: () => unknown) {
  CommandRegistry.addCommand({ name, description: name, handler, originalFn: handler });
  return name;
}

beforeEach(() => {
  metrics.commandsTotal.inc.mockReset();
  metrics.commandsErrorsTotal.inc.mockReset();
  metrics.commandDurationSeconds.startTimer.mockReset();
  metrics.commandDurationSeconds.startTimer.mockImplementation(() => vi.fn());
});

describe("CommandRegistry", () => {
  it("throws BotNotInitializedError when no bot is set", () => {
    const previous = (CommandRegistry as unknown as { bot?: unknown }).bot;
    setBotState(undefined);
    try {
      expect(() => CommandRegistry.registerAllCommands())
        .toThrow(BotNotInitializedError);
    } finally {
      setBotState(previous);
    }
  });

  it("registers all commands on the bot", () => {
    const fake = makeFakeBot();
    const name = addCommand("greet", async () => ({ type: "text", text: "hi" }));
    setBotState(fake.bot);

    CommandRegistry.registerAllCommands();

    expect(fake.command).toHaveBeenCalledWith(name, expect.any(Function));
    expect(fake.registeredCommands.has(name)).toBe(true);
  });

  it("finds a command by name", () => {
    const name = addCommand("findme", async () => ({ type: "text", text: "x" }));
    expect(CommandRegistry.findByName(name)?.name).toBe(name);
    expect(CommandRegistry.findByName("missing")).toBeUndefined();
  });

  it("lists all commands", () => {
    expect(CommandRegistry.getAll().length).toBeGreaterThan(0);
  });

  it("increments counters and stops the timer on success", async () => {
    const fake = makeFakeBot();
    const name = addCommand("ok", async () => ({ type: "text", text: "ok" }));
    setBotState(fake.bot);
    CommandRegistry.registerAllCommands();

    const ctx = makeFakeContext();
    await fake.registeredCommands.get(name)(ctx);

    expect(metrics.commandsTotal.inc).toHaveBeenCalledWith({ command: name });
    const stopTimer = metrics.commandDurationSeconds.startTimer.mock.results[0]?.value;
    expect(stopTimer).toHaveBeenCalled();
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it("replies with the error message for a LeetCodeBotError", async () => {
    const fake = makeFakeBot();
    const name = addCommand(
      "fails_domain",
      async () => {
        throw new LeetCodeBotError("domain boom");
      },
    );
    setBotState(fake.bot);
    CommandRegistry.registerAllCommands();

    const ctx = makeFakeContext();
    await fake.registeredCommands.get(name)(ctx);

    expect(ctx.reply).toHaveBeenCalledWith("domain boom");
    expect(metrics.commandsErrorsTotal.inc).toHaveBeenCalledWith({
      command: name,
      error: "LeetCodeBotError",
    });
  });

  it("replies with a generic message and the error name for unknown errors", async () => {
    const fake = makeFakeBot();
    const name = addCommand(
      "fails_generic",
      async () => {
        throw new Error("boom");
      },
    );
    setBotState(fake.bot);
    CommandRegistry.registerAllCommands();

    const ctx = makeFakeContext();
    await fake.registeredCommands.get(name)(ctx);

    expect(ctx.reply).toHaveBeenCalledWith("❗ An error occurred.");
    expect(metrics.commandsErrorsTotal.inc).toHaveBeenCalledWith({
      command: name,
      error: "Error",
    });
  });
});