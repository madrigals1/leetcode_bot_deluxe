import { ApiService } from "./api";

export interface User {
  id: number;
  url: string;
  username: string;
  solved: number;
  solved_cml: number;
  created_at: string;
  updated_at: string;
}

export interface UserRating {
  id: number;
  username: string;
  solved: number;
  solved_cml: number;
}

class UsersService extends ApiService {
  list(params?: { channel_id?: number }) {
    const query = params?.channel_id
      ? `?channel_users__channel_id=${params.channel_id}`
      : "";
    return this.fetch<User[]>(`/api/v1/users/${query}`);
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
