import { ApiService } from "./api_service";
import type { ContestNotification } from "./types";

export class ContestNotificationsService {
  static list() {
    return ApiService.fetch<ContestNotification[]>(
      "/api/v1/contest-notifications/",
    );
  }

  static getById(id: number) {
    return ApiService.fetch<ContestNotification>(
      `/api/v1/contest-notifications/${id}/`,
    );
  }

  static closest(channelId: number, nearestXMinutes?: number) {
    const query = nearestXMinutes
      ? `?nearest_x_minutes=${nearestXMinutes}`
      : "";
    return ApiService.fetch<ContestNotification[]>(
      `/api/v1/contest-notifications/${channelId}/closest/${query}`,
    );
  }

  static delete(id: number) {
    return ApiService.fetch<void>(
      `/api/v1/contest-notifications/${id}/`,
      { method: "DELETE" },
    );
  }
}
