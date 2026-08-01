import {
  BackendUserNotFoundError,
  TelegramUserHasNoClaimError,
  LeetCodeUserNotFoundError,
} from ".";

export function userNotFound(username: string, chatId?: number) {
  return (err: Error) => {
    if (err.message.includes("404")) {
      throw new BackendUserNotFoundError(username, chatId);
    }
    throw err;
  };
}

export function telegramUserHasNoClaim() {
  return (err: Error) => {
    if (err.message.includes("TELEGRAM_USER_HAS_NO_CLAIM")) {
      throw new TelegramUserHasNoClaimError();
    }
    throw err;
  };
}

export function leetcodeUserNotFound(username: string) {
  return (err: Error) => {
    if (err.message.includes("USER_NOT_FOUND_IN_LEETCODE")) {
      throw new LeetCodeUserNotFoundError(username);
    }
    throw err;
  };
}
