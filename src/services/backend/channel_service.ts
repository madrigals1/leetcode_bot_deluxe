import { ApiService } from "./api_service";
import type { PaginatedResponse, Channel, ChannelUser } from "./types";

export class ChannelsService {
  static list(params?: { chat_id?: number }) {
    const query = params?.chat_id ? `?chat_id=${params.chat_id}` : "";
    return ApiService.fetch<Channel[]>(`/api/v1/channels/${query}`);
  }

  static get(pk: number) {
    return ApiService.fetch<Channel>(`/api/v1/channels/${pk}/`);
  }

  static getUsers(chatId: number, page?: number, ordering?: string) {
    const params = new URLSearchParams();
    if (page) {
      params.set("page", String(page));
    }
    if (ordering) {
      params.set("ordering", ordering);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return ApiService.fetch<PaginatedResponse<ChannelUser>>(
      `/api/v1/channels/${chatId}/users/${query}`,
    );
  }

  static getUsersSimplified(chatId: number, page?: number, ordering?: string) {
    const params = new URLSearchParams();
    if (page) {
      params.set("page", String(page));
    }
    if (ordering) {
      params.set("ordering", ordering);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return ApiService.fetch<PaginatedResponse<ChannelUser>>(
      `/api/v1/channels/${chatId}/users/simplified/${query}`,
    );
  }

  static create(chatId: number, title: string) {
    return ApiService.fetch<Channel>("/api/v1/channels/", {
      method: "POST",
      body: JSON.stringify({ chat_id: chatId, title }),
    });
  }

  static getOrCreate(chatId: number, title: string) {
    return ApiService.fetch<Channel>("/api/v1/channels/get-or-create/", {
      method: "POST",
      body: JSON.stringify({ chat_id: chatId, title }),
    });
  }

  static refresh(chatId: number) {
    return ApiService.fetch<{ detail: string }>(
      `/api/v1/channels/${chatId}/refresh/`,
    );
  }

  static subscribe(chatId: number, type: string) {
    return ApiService.fetch<{ message: string }>(
      `/api/v1/channels/${chatId}/subscribe/`,
      {
        method: "POST",
        body: JSON.stringify({ type }),
      },
    );
  }

  static unsubscribe(chatId: number, type: string) {
    return ApiService.fetch<{ message: string }>(
      `/api/v1/channels/${chatId}/unsubscribe/`,
      {
        method: "POST",
        body: JSON.stringify({ type }),
      },
    );
  }

  static delete(pk: number) {
    return ApiService.fetch<void>(`/api/v1/channels/${pk}/`, {
      method: "DELETE",
    });
  }
}
