import {
  BackendUserNotFoundError,
  TelegramUserHasNoTrackError,
  LeetCodeUserNotFoundError,
  UserAlreadyInChannelError,
  UserAlreadyTrackedError,
} from ".";

export function userNotFound(username: string) {
  return (err: Error) => {
    if (
      err.message.includes("USER_NOT_FOUND_IN_DATABASE")
      || err.message.includes("USER_NOT_FOUND_IN_CHANNEL")
    ) {
      throw new BackendUserNotFoundError(username);
    }
    throw err;
  };
}

export function telegramUserHasNoTrack() {
  return (err: Error) => {
    if (err.message.includes("TELEGRAM_USER_HAS_NO_CLAIM")) {
      throw new TelegramUserHasNoTrackError();
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

export function userAlreadyInChannel(username: string) {
  return (err: Error) => {
    if (err.message.includes("USER_ALREADY_IN_CHANNEL")) {
      throw new UserAlreadyInChannelError(username);
    }
    throw err;
  };
}

export function userAlreadyTracked(username: string) {
  return (err: Error) => {
    if (err.message.includes("USER_ALREADY_TRACKED")) {
      throw new UserAlreadyTrackedError(username);
    }
    throw err;
  };
}
