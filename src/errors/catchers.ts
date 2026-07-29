import { BackendUserNotFoundError } from ".";

export function userNotFound(username: string) {
  return (err: Error) => {
    if (err.message.includes("404")) {
      throw new BackendUserNotFoundError(username);
    }
    throw err;
  };
}
