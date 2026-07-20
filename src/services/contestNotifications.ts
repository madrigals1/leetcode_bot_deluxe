import { ApiService } from "./api";

export interface ContestNotification {
  id: number;
  contest: { id: number; title: string; start_time: string };
  subscription: { id: number; type: string };
}

class ContestNotificationsService extends ApiService {
  list() {
    return this.fetch<ContestNotification[]>(
      "/api/v1/contest-notifications/",
    );
  }

  getById(id: number) {
    return this.fetch<ContestNotification>(
      `/api/v1/contest-notifications/${id}/`,
    );
  }

  closest(channelId: number, nearestXMinutes?: number) {
    const query = nearestXMinutes
      ? `?nearest_x_minutes=${nearestXMinutes}`
      : "";
    return this.fetch<ContestNotification[]>(
      `/api/v1/contest-notifications/${channelId}/closest/${query}`,
    );
  }

  delete(id: number) {
    return this.fetch<void>(
      `/api/v1/contest-notifications/${id}/`,
      { method: "DELETE" },
    );
  }
}

export const contestNotificationsService =
  new ContestNotificationsService();
