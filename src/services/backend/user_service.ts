import { ApiService } from "./api_service";
import {
  leetcodeUserNotFound,
  userAlreadyInChannel,
  userNotFound,
} from "@/errors/catchers";

export class UsersService {
  static addToChannel(username: string, chatId: number) {
    return ApiService
      .fetch<{ message: string }>(
        "/api/v1/users/add-to-channel/",
        {
          method: "POST",
          body: JSON.stringify({ username, chat_id: chatId }),
        },
      )
      .catch(leetcodeUserNotFound(username))
      .catch(userAlreadyInChannel(username));
  }

  static removeFromChannel(username: string, chatId: number) {
    return ApiService
      .fetch<{ message: string }>(
        "/api/v1/users/remove-from-channel/",
        {
          method: "POST",
          body: JSON.stringify({ username, chat_id: chatId }),
        },
      )
      .catch(userNotFound(username));
  }
}