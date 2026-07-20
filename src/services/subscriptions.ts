import { ApiService } from "./api";

export interface Subscription {
  id: number;
  channel: { id: number; chat_id: number; title: string };
  type: string;
}

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
