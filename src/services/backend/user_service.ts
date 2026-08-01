import { ApiService } from "./api_service";
import type { PaginatedResponse, User } from "./types";
import {
  leetcodeUserNotFound,
  userAlreadyInChannel,
  userNotFound,
} from "@/errors/catchers";

export class UsersService {
  static list(params?: { channel_chat_id?: number; page?: number }) {
    const queryParts: string[] = [];

    if (params?.channel_chat_id) {
      queryParts.push(
        `channel_users__channel__chat_id=${params.channel_chat_id}`,
      );
    }

    if (params?.page) {
      queryParts.push(`page=${params.page}`);
    }

    const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return ApiService.fetch<PaginatedResponse<User>>(`/api/v1/users/${query}`);
  }

  static getByUsername(username: string) {
    return ApiService
      .fetch<User>(`/api/v1/users/${username}/`)
      .catch(userNotFound(username));
  }

  static getById(id: number) {
    return ApiService.fetch<User>(`/api/v1/users/${id}/`);
  }

  static create(username: string) {
    return ApiService.fetch<User>("/api/v1/users/", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  }

  static refresh(username: string) {
    return ApiService
      .fetch<User>(`/api/v1/users/${username}/refresh/`)
      .catch(userNotFound(username));
  }

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

  static avatar(username: string) {
    return ApiService
      .fetch<{ avatar_url: string }>(`/api/v1/users/${username}/avatar/`)
      .catch(userNotFound(username));
  }
}
