import {
  BackendApiError,
  BackendUserNotFoundError,
  TelegramUserHasNoTrackError,
  LeetCodeUserNotFoundError,
  UserAlreadyInChannelError,
  UserAlreadyTrackedError,
} from ".";

function isBackendError(error: Error, code: string): boolean {
  return error instanceof BackendApiError && error.code === code;
}

export function userNotFound(username: string) {
  return (err: Error) => {
    if (
      isBackendError(err, "USER_NOT_FOUND_IN_DATABASE")
      || isBackendError(err, "USER_NOT_FOUND_IN_CHANNEL")
    ) {
      throw new BackendUserNotFoundError(username);
    }
    throw err;
  };
}

export function telegramUserHasNoTrack() {
  return (err: Error) => {
    if (isBackendError(err, "TELEGRAM_USER_HAS_NO_TRACK")) {
      throw new TelegramUserHasNoTrackError();
    }
    throw err;
  };
}

export function leetcodeUserNotFound(username: string) {
  return (err: Error) => {
    if (isBackendError(err, "USER_NOT_FOUND_IN_LEETCODE")) {
      throw new LeetCodeUserNotFoundError(username);
    }
    throw err;
  };
}

export function userAlreadyInChannel(username: string) {
  return (err: Error) => {
    if (isBackendError(err, "USER_ALREADY_IN_CHANNEL")) {
      throw new UserAlreadyInChannelError(username);
    }
    throw err;
  };
}

export function userAlreadyTracked(username: string) {
  return (err: Error) => {
    if (isBackendError(err, "USER_ALREADY_TRACKED")) {
      throw new UserAlreadyTrackedError(username);
    }
    throw err;
  };
}