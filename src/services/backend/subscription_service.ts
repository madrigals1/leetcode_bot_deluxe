import { ApiService } from "./api_service";
import type { Subscription } from "./types";

class SubscriptionsService extends ApiService {
  list() {
    return this.fetch<Subscription[]>("/api/v1/subscriptions/");
  }

  getById(id: number) {
    return this.fetch<Subscription>(`/api/v1/subscriptions/${id}/`);
  }

  create(channelId: number, type: string) {
    return this.fetch<Subscription>("/api/v1/subscriptions/", {
      method: "POST",
      body: JSON.stringify({ channel: channelId, type }),
    });
  }

  delete(channelId: number, type: string) {
    return this.fetch<{ message: string }>(
      "/api/v1/subscriptions/delete/",
      {
        method: "POST",
        body: JSON.stringify({ channel: channelId, type }),
      },
    );
  }
}

export const subscriptionsService = new SubscriptionsService();
