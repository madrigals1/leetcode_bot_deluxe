import { ApiService } from "./api_service";
import type { Subscription } from "./types";

export class SubscriptionsService {
  static list() {
    return ApiService.fetch<Subscription[]>("/api/v1/subscriptions/");
  }

  static getById(id: number) {
    return ApiService.fetch<Subscription>(`/api/v1/subscriptions/${id}/`);
  }

  static create(channelId: number, type: string) {
    return ApiService.fetch<Subscription>("/api/v1/subscriptions/", {
      method: "POST",
      body: JSON.stringify({ channel: channelId, type }),
    });
  }

  static delete(channelId: number, type: string) {
    return ApiService.fetch<{ message: string }>(
      "/api/v1/subscriptions/delete/",
      {
        method: "POST",
        body: JSON.stringify({ channel: channelId, type }),
      },
    );
  }
}
