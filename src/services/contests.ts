import { ApiService } from "./api";

export interface Contest {
  id: number;
  title: string;
  start_time: string;
  duration: number;
}

class ContestsService extends ApiService {
  list() {
    return this.fetch<Contest[]>("/api/v1/contests/");
  }

  getById(id: number) {
    return this.fetch<Contest>(`/api/v1/contests/${id}/`);
  }

  create(title: string, startTime: string, duration: number) {
    return this.fetch<Contest>("/api/v1/contests/", {
      method: "POST",
      body: JSON.stringify({
        title,
        start_time: startTime,
        duration,
      }),
    });
  }

  delete(id: number) {
    return this.fetch<void>(`/api/v1/contests/${id}/`, {
      method: "DELETE",
    });
  }
}

export const contestsService = new ContestsService();
