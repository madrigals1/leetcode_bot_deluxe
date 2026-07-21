import { ApiService, type PaginatedResponse } from "./api";

export interface User {
  id: number;
  url: string;
  username: string;
  solved: number;
  solved_cml: number;
  data: {
    profile?: {
      realName?: string;
      userAvatar?: string;
    };
    submitStats?: {
      acSubmissionNum: Array<{ difficulty: string; count: number }>;
      totalSubmissionNum: Array<{ difficulty: string; count: number }>;
    };
  };
  created_at: string;
  updated_at: string;
}

class UsersService extends ApiService {
  list(params?: { channel_chat_id?: number; page?: number }) {
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
    return this.fetch<PaginatedResponse<User>>(`/api/v1/users/${query}`);
  }

  getByUsername(username: string) {
    return this.fetch<User>(`/api/v1/users/${username}/`);
  }

  getById(id: number) {
    return this.fetch<User>(`/api/v1/users/${id}/`);
  }

  create(username: string) {
    return this.fetch<User>("/api/v1/users/", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  }

  refresh(username: string) {
    return this.fetch<User>(`/api/v1/users/${username}/refresh/`);
  }

  addToChannel(username: string, chatId: number) {
    return this.fetch<{ message: string }>(
      "/api/v1/users/add-to-channel/",
      {
        method: "POST",
        body: JSON.stringify({ username, chat_id: chatId }),
      },
    );
  }

  removeFromChannel(username: string, chatId: number) {
    return this.fetch<{ message: string }>(
      "/api/v1/users/remove-from-channel/",
      {
        method: "POST",
        body: JSON.stringify({ username, chat_id: chatId }),
      },
    );
  }

  avatar(username: string) {
    return this.fetch<{ avatar_url: string }>(
      `/api/v1/users/${username}/avatar/`,
    );
  }
}

export const usersService = new UsersService();
