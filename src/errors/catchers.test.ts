import { describe, expect, it } from "vitest";
import {
  BackendUserNotFoundError,
  LeetCodeUserNotFoundError,
  TelegramUserHasNoTrackError,
  UserAlreadyInChannelError,
  UserAlreadyTrackedError,
} from "@/errors";
import {
  leetcodeUserNotFound,
  telegramUserHasNoTrack,
  userAlreadyInChannel,
  userAlreadyTracked,
  userNotFound,
} from "./catchers";

function run(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    return error as Error;
  }
  throw new Error("expected the catcher to throw");
}

describe("userNotFound", () => {
  it.each(["USER_NOT_FOUND_IN_DATABASE", "USER_NOT_FOUND_IN_CHANNEL"])(
    "maps %s to BackendUserNotFoundError",
    (code) => {
      const error = run(() =>
        userNotFound("alice")(new Error(`prefix ${code} suffix`))
      );

      expect(error).toBeInstanceOf(BackendUserNotFoundError);
      expect(error.message).toContain("alice");
      expect(error.name).toBe("LeetCodeBotError.BackendUserNotFoundError");
    },
  );

  it("rethrows unrelated errors untouched", () => {
    const unrelated = new Error("something else");
    let caught: Error | undefined;
    try {
      userNotFound("alice")(unrelated);
    } catch (error) {
      caught = error as Error;
    }
    expect(caught).toBe(unrelated);
  });
});

describe("leetcodeUserNotFound", () => {
  it("maps USER_NOT_FOUND_IN_LEETCODE", () => {
    const error = run(() =>
      leetcodeUserNotFound("bob")(new Error("USER_NOT_FOUND_IN_LEETCODE"))
    );
    expect(error).toBeInstanceOf(LeetCodeUserNotFoundError);
    expect(error.message).toContain("bob");
    expect(error.name).toBe("LeetCodeBotError.LeetCodeUserNotFoundError");
  });
});

describe("telegramUserHasNoTrack", () => {
  it("maps TELEGRAM_USER_HAS_NO_TRACK", () => {
    const error = run(() =>
      telegramUserHasNoTrack()(new Error("TELEGRAM_USER_HAS_NO_TRACK"))
    );
    expect(error).toBeInstanceOf(TelegramUserHasNoTrackError);
    expect(error.name).toBe("LeetCodeBotError.TelegramUserHasNoTrackError");
  });
});

describe("userAlreadyInChannel", () => {
  it("maps USER_ALREADY_IN_CHANNEL", () => {
    const error = run(() =>
      userAlreadyInChannel("alice")(new Error("USER_ALREADY_IN_CHANNEL"))
    );
    expect(error).toBeInstanceOf(UserAlreadyInChannelError);
    expect(error.message).toContain("alice");
  });
});

describe("userAlreadyTracked", () => {
  it("maps USER_ALREADY_TRACKED", () => {
    const error = run(() =>
      userAlreadyTracked("bob")(new Error("USER_ALREADY_TRACKED"))
    );
    expect(error).toBeInstanceOf(UserAlreadyTrackedError);
    expect(error.message).toContain("bob");
  });
});