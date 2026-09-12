import { describe, expect, it, vi } from "vitest";

interface FakeBotLike {
  api: { config: { use: ReturnType<typeof vi.fn> } };
  command: ReturnType<typeof vi.fn>;
  callbackQuery: ReturnType<typeof vi.fn>;
  catch: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  apiConfigUse: ((prev: unknown, method: string, payload: object) => unknown) | undefined;
}

const grammy = vi.hoisted(() => {
  const instances: FakeBotLike[] = [];

  class FakeBot {
    api: FakeBotLike["api"];
    command: FakeBotLike["command"];
    callbackQuery: FakeBotLike["callbackQuery"];
    catch: FakeBotLike["catch"];
    start: FakeBotLike["start"];
    apiConfigUse: FakeBotLike["apiConfigUse"];

    constructor() {
      this.api = {
        config: {
          use: vi.fn((handler: (prev: unknown, method: string, payload: object) => unknown) => {
            this.apiConfigUse = handler;
          }),
        },
      };
      this.command = vi.fn();
      this.callbackQuery = vi.fn();
      this.catch = vi.fn();
      this.start = vi.fn(async (opts?: { onStart?: (info: { username: string }) => void }) => {
        opts?.onStart?.({ username: "test_bot" });
      });
      instances.push(this);
    }
  }

  class Context {}
  class InlineKeyboard {}

  return { instances, FakeBot, Context, InlineKeyboard };
});

vi.mock("grammy", () => ({
  Bot: grammy.FakeBot,
  Context: grammy.Context,
  InlineKeyboard: grammy.InlineKeyboard,
}));

const health = vi.hoisted(() => ({
  viz: vi.fn(async () => ({ status: "ok", uptime: 120 })),
  backend: vi.fn(async () => ({
    status: "ok",
    timestamp: 1,
    database: "postgres",
    service: "backend",
    version: "1.0",
    uptime: 3600,
  })),
}));

vi.mock("@/services/vizapi", () => ({
  VizApiService: { health: health.viz },
}));

vi.mock("@/services/backend/health_check_service", () => ({
  HealthCheckService: { health: health.backend },
}));

const metricsMock = vi.hoisted(() => ({
  apiRequestsTotal: { inc: vi.fn() },
  apiErrorsTotal: { inc: vi.fn() },
  commandsTotal: { inc: vi.fn() },
  commandsErrorsTotal: { inc: vi.fn() },
  commandDurationSeconds: { startTimer: vi.fn(() => vi.fn()) },
  callbacksTotal: { inc: vi.fn() },
  uncaughtErrorsTotal: { inc: vi.fn() },
  paginationErrorsTotal: { inc: vi.fn() },
  startMetricsServer: vi.fn(),
}));

vi.mock("@/metrics", () => metricsMock);

describe("index bootstrap", () => {
  it("runs health checks, wires the bot, and installs middleware and catch", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("@/index");
    await vi.waitFor(() => {
      expect(grammy.instances.length).toBe(1);
    });

    expect(health.viz).toHaveBeenCalled();
    expect(health.backend).toHaveBeenCalled();
    expect(metricsMock.startMetricsServer).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      "VizAPI health: ok (uptime 2m 0s)",
    );
    expect(logSpy).toHaveBeenCalledWith(
      "Backend health: ok (db postgres, backend v1.0, uptime 1h 0m 0s)",
    );

    const bot = grammy.instances[0];
    expect(bot).toBeDefined();
    expect(bot.command).toHaveBeenCalledTimes(18);
    expect(bot.callbackQuery).toHaveBeenCalledTimes(2);
    expect(bot.catch).toHaveBeenCalledTimes(1);
    expect(bot.start).toHaveBeenCalledWith({ onStart: expect.any(Function) });
    expect(logSpy).toHaveBeenCalledWith("Bot @test_bot is running.");

    const handler = bot.apiConfigUse!;
    const prev = vi.fn((_method: string, payload: object) => payload);
    const payload = { chat_id: 1, text: "hi" };
    handler(prev, "sendMessage", payload);
    expect(prev).toHaveBeenCalledWith("sendMessage", {
      chat_id: 1,
      text: "hi",
      parse_mode: "HTML",
    });

    const marked = { chat_id: 1, text: "hi", parse_mode: "Markdown" };
    handler(prev, "sendMessage", marked);
    expect(prev).toHaveBeenLastCalledWith("sendMessage", {
      chat_id: 1,
      text: "hi",
      parse_mode: "Markdown",
    });

    const catchHandler = bot.catch.mock.calls[0][0];
    await catchHandler({ error: new Error("boom"), ctx: undefined });
    expect(metricsMock.uncaughtErrorsTotal.inc).toHaveBeenCalledWith({
      error: "Error",
    });
    expect(errorSpy).toHaveBeenCalledWith("Unhandled bot error:", expect.any(Error));

    const ctx = { callbackQuery: { data: "x" }, answerCallbackQuery: vi.fn() };
    await catchHandler({ error: { name: "Weird" } as unknown as Error, ctx });
    expect(metricsMock.uncaughtErrorsTotal.inc).toHaveBeenCalledWith({
      error: "unknown",
    });
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith(
      "An error occurred. Please try again.",
    );

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});