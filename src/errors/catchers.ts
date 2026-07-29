import { BackendUserNotFoundError } from ".";

export function userNotFound(username: string, chatId?: number) {
  return (err: Error) => {
    if (err.message.includes("404")) {
      throw new BackendUserNotFoundError(username, chatId);
    }
    throw err;
  };
}
