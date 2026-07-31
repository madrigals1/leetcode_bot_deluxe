import { BackendUserNotFoundError, TelegramUserHasNoClaimError } from ".";

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
