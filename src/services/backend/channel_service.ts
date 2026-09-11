import { ApiService } from "./api_service";
import type { PaginatedResponse, ChannelUser } from "./types";

export class ChannelsService {
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

  static refresh(chatId: number) {
    return ApiService.fetch<{ detail: string }>(
      `/api/v1/channels/${chatId}/refresh/`,
    );
  }
}