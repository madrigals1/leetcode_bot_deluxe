import { beforeEach, describe, expect, it, vi } from "vitest";
import { LbContext } from "@/utils/context";
import { PaginationRegistry } from "./registry";
import { makeFakeBot } from "../../../../tests/helpers/makeFakeBot";
import { makeFakeContext } from "../../../../tests/helpers/makeFakeContext";

const mocks = vi.hoisted(() => ({
  paginationErrorsTotal: { inc: vi.fn() },
}));

vi.mock("@/metrics", () => ({
  paginationErrorsTotal: mocks.paginationErrorsTotal,
}));

const PAGE_PATTERN = /^(\w+)_page:(\d+)$/;

function registerHandler(name: string) {
  const fetchPage = vi.fn(async () => ({ count: 1, results: [{ id: 1 }] }));
  const renderPage = vi.fn(async () => undefined);

  PaginationRegistry.registerHandler(name, {
    fetchPage,
    renderPage,
    defaultPageSize: 10,
    defaultButtonsPerRow: 2,
  } as never);

  return { fetchPage, renderPage };
}

describe("PaginationRegistry", () => {
  let capture: (ctx: unknown) => Promise<unknown>;

  beforeEach(() => {
    mocks.paginationErrorsTotal.inc.mockClear();
    const fake = makeFakeBot();
    PaginationRegistry.setBot(fake.bot);
    capture = (ctx) =>
      Promise.resolve(fake.registeredCallbacks.get(PAGE_PATTERN.source)!(ctx as never));
  });

  it("registers a pagination callback query handler", () => {
    const fake = makeFakeBot();
    PaginationRegistry.setBot(fake.bot);
    expect(fake.registeredCallbacks.has(PAGE_PATTERN.source)).toBe(true);
  });

  it("ignores taps for unknown names", async () => {
    const { fetchPage } = registerHandler("leaderboard");
    const ctx = makeFakeContext({
      match: ["unknown_page:1", "unknown", "1"],
    });
    await capture(ctx);
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("fails safely when the match is missing", async () => {
    const { fetchPage } = registerHandler("leaderboard");
    const ctx = makeFakeContext({ match: null });
    await capture(ctx);
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("answers an invalid page number without fetching", async () => {
    const { fetchPage } = registerHandler("leaderboard");
    const ctx = makeFakeContext({ match: ["leaderboard_page:0", "leaderboard", "0"] });
    await capture(ctx);

    expect(fetchPage).not.toHaveBeenCalled();
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith("Invalid page number.");
  });

  it("fetches and renders the requested page", async () => {
    const { fetchPage, renderPage } = registerHandler("leaderboard");
    const ctx = makeFakeContext({
      match: ["leaderboard_page:1", "leaderboard", "1"],
    });
    await capture(ctx);

    expect(fetchPage).toHaveBeenCalledWith(1, expect.any(LbContext));
    expect(renderPage).toHaveBeenCalledTimes(1);
  });

  it("reports no data to the user", async () => {
    PaginationRegistry.registerHandler("empty", {
      fetchPage: vi.fn(async () => ({ count: 0, results: [] })),
      renderPage: vi.fn(),
      defaultPageSize: 10,
    } as never);

    const ctx = makeFakeContext({ match: ["empty_page:1", "empty", "1"] });
    await capture(ctx);

    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith("❗ No data found.");
    expect(mocks.paginationErrorsTotal.inc).toHaveBeenCalledWith({ name: "empty" });
  });

  it("falls back to an error message for unexpected failures", async () => {
    PaginationRegistry.registerHandler("broken", {
      fetchPage: vi.fn(async () => ({ count: 1, results: [{ id: 1 }] })),
      renderPage: vi.fn(async () => {
        throw new Error("boom");
      }),
      defaultPageSize: 10,
    } as never);

    const ctx = makeFakeContext({ match: ["broken_page:1", "broken", "1"] });
    await capture(ctx);

    expect(ctx.editMessageText).toHaveBeenCalledWith("❗ Failed to fetch data.");
    expect(mocks.paginationErrorsTotal.inc).toHaveBeenCalledWith({ name: "broken" });
  });
});