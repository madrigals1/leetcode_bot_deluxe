import { ApiService, type PaginatedResponse } from "./api";

export interface Channel {
  id: number;
  chat_id: number;
  title: string;
  subscriptions: Array<{ id: number; type: string }>;
}

export interface ChannelUser {
  id: number;
  user: {
    id: number;
    username: string;
    solved: number;
    solved_cml: number;
  };
  created_at: string;
  updated_at: string;
}

class ChannelsService extends ApiService {
  list(params?: { chat_id?: number }) {
    const query = params?.chat_id ? `?chat_id=${params.chat_id}` : "";
    return this.fetch<Channel[]>(`/api/v1/channels/${query}`);
  }

  get(pk: number) {
    return this.fetch<Channel>(`/api/v1/channels/${pk}/`);
  }

  getUsers(chatId: number, page?: number, ordering?: string) {
    const params = new URLSearchParams();
    if (page) {
      params.set("page", String(page));
    }
    if (ordering) {
      params.set("ordering", ordering);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.fetch<PaginatedResponse<ChannelUser>>(
      `/api/v1/channels/${chatId}/users/${query}`,
    );
  }

  create(chatId: number, title: string) {
    return this.fetch<Channel>("/api/v1/channels/", {
      method: "POST",
      body: JSON.stringify({ chat_id: chatId, title }),
    });
  }

  getOrCreate(chatId: number, title: string) {
    return this.fetch<Channel>("/api/v1/channels/get-or-create/", {
      method: "POST",
      body: JSON.stringify({ chat_id: chatId, title }),
    });
  }

  refresh(chatId: number) {
    return this.fetch<{ message: string }>(
      `/api/v1/channels/${chatId}/refresh/`,
    );
  }

  subscribe(chatId: number, type: string) {
    return this.fetch<{ message: string }>(
      `/api/v1/channels/${chatId}/subscribe/`,
      {
        method: "POST",
        body: JSON.stringify({ type }),
      },
    );
  }

  unsubscribe(chatId: number, type: string) {
    return this.fetch<{ message: string }>(
      `/api/v1/channels/${chatId}/unsubscribe/`,
      {
        method: "POST",
        body: JSON.stringify({ type }),
      },
    );
  }

  delete(pk: number) {
    return this.fetch<void>(`/api/v1/channels/${pk}/`, {
      method: "DELETE",
    });
  }
}

export const channelsService = new ChannelsService();
