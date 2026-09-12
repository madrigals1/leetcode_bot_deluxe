import { describe, expect, it } from "vitest";
import {
  BackendNotAvailableError,
  BackendUserNotFoundError,
  BotNotInitializedError,
  ChatIdNotFoundError,
  DataNotFoundError,
  InvalidArgumentAmountError,
  LeetCodeBotError,
  LeetCodeUserNotFoundError,
  MatchNotFoundError,
  TelegramUserHasNoTrackError,
  TelegramUsernameNotFoundError,
  UnauthorizedError,
  UserAlreadyInChannelError,
  UserAlreadyTrackedError,
  VizApiNotAvailableError,
} from "./index";

describe("error classes", () => {
  it("LeetCodeBotError carries message and name", () => {
    const err = new LeetCodeBotError("boom");
    expect(err.message).toBe("boom");
    expect(err.name).toBe("LeetCodeBotError");
    expect(err instanceof LeetCodeBotError).toBe(true);
  });

  it("InvalidArgumentAmountError includes the expected count and example", () => {
    const err = new InvalidArgumentAmountError(2, 1, "\nExample: /foo <a>");
    expect(err.message).toContain("expected 2, got 1");
    expect(err.message).toContain("Example: /foo <a>");
    expect(err.name).toBe("LeetCodeBotError.InvalidArgumentAmountError");
  });

  it("InvalidArgumentAmountError omits the example when absent", () => {
    const err = new InvalidArgumentAmountError(2, 1);
    expect(err.message).toBe("❗ Invalid argument count: expected 2, got 1.");
  });

  it("UnauthorizedError", () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe("❗ You don't have permission to use this command.");
    expect(err.name).toBe("LeetCodeBotError.UnauthorizedError");
  });

  it("ChatIdNotFoundError", () => {
    const err = new ChatIdNotFoundError();
    expect(err.message).toBe("❗ Could not determine chat ID.");
  });

  it("TelegramUsernameNotFoundError", () => {
    const err = new TelegramUsernameNotFoundError();
    expect(err.message).toBe("❗ Could not determine your Telegram username.");
  });

  it("MatchNotFoundError", () => {
    const err = new MatchNotFoundError();
    expect(err.message).toBe("❗ Internal error: match result not found.");
  });

  it("DataNotFoundError", () => {
    const err = new DataNotFoundError();
    expect(err.message).toBe("❗ No data found.");
  });

  it("BackendNotAvailableError", () => {
    const err = new BackendNotAvailableError();
    expect(err.message).toBe("❗ Backend is not available.");
  });

  it("BotNotInitializedError", () => {
    const err = new BotNotInitializedError();
    expect(err.message).toBe("❗ Bot is not initialized.");
  });

  it("VizApiNotAvailableError", () => {
    const err = new VizApiNotAvailableError();
    expect(err.message).toBe("❗ VizAPI is not available.");
  });

  it("BackendUserNotFoundError formats the username", () => {
    const err = new BackendUserNotFoundError("alice");
    expect(err.message).toBe('❗ User <b>"alice"</b> was not found in this channel.');
    expect(err.name).toBe("LeetCodeBotError.BackendUserNotFoundError");
  });

  it("TelegramUserHasNoTrackError", () => {
    const err = new TelegramUserHasNoTrackError();
    expect(err.message).toContain("track a LeetCode username first");
  });

  it("LeetCodeUserNotFoundError formats the username", () => {
    const err = new LeetCodeUserNotFoundError("bob");
    expect(err.message).toBe('❗ User <b>"bob"</b> does not exist in LeetCode.');
  });

  it("UserAlreadyInChannelError formats the username", () => {
    const err = new UserAlreadyInChannelError("alice");
    expect(err.message).toBe('⚠️ User <b>"alice"</b> is already added to this channel.');
  });

  it("UserAlreadyTrackedError formats the username", () => {
    const err = new UserAlreadyTrackedError("bob");
    expect(err.message).toBe('⚠️ You are already tracking <b>"bob"</b>.');
  });

  it("all domain errors extend LeetCodeBotError", () => {
    const errors = [
      new InvalidArgumentAmountError(1, 2),
      new UnauthorizedError(),
      new ChatIdNotFoundError(),
      new TelegramUsernameNotFoundError(),
      new MatchNotFoundError(),
      new DataNotFoundError(),
      new BackendNotAvailableError(),
      new BotNotInitializedError(),
      new VizApiNotAvailableError(),
      new BackendUserNotFoundError("x"),
      new TelegramUserHasNoTrackError(),
      new LeetCodeUserNotFoundError("x"),
      new UserAlreadyInChannelError("x"),
      new UserAlreadyTrackedError("x"),
    ];
    for (const err of errors) {
      expect(err).toBeInstanceOf(LeetCodeBotError);
    }
  });
});