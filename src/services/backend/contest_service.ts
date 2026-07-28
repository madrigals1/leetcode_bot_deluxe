import { ApiService } from "./api_service";
import type { Contest } from "./types";

export class ContestsService {
  static list() {
    return ApiService.fetch<Contest[]>("/api/v1/contests/");
  }

  static getById(id: number) {
    return ApiService.fetch<Contest>(`/api/v1/contests/${id}/`);
  }

  static create(title: string, startTime: string, duration: number) {
    return ApiService.fetch<Contest>("/api/v1/contests/", {
      method: "POST",
      body: JSON.stringify({
        title,
        start_time: startTime,
        duration,
      }),
    });
  }

  static delete(id: number) {
    return ApiService.fetch<void>(`/api/v1/contests/${id}/`, {
      method: "DELETE",
    });
  }
}
