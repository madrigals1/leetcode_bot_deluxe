import { ApiService } from "./api_service";
import type { User } from "./types";
import { userNotFound } from "@/errors/catchers";

export class ChannelUsersService {
  static getUserInChannel(username: string, chatId: number) {
    return ApiService
      .fetch<User>(`/api/v1/channels/${chatId}/users/${username}/`)
      .catch(userNotFound(username, chatId));
  }
}
