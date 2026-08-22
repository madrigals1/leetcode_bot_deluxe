import { ApiService } from "./api_service";

export interface HealthResponse {
  status: string;
  timestamp: number;
  database: string;
  service: string;
  version: string;
  uptime: number;
}

export class HealthCheckService {
  static async health(): Promise<HealthResponse> {
    return ApiService.fetch<HealthResponse>("/api/health");
  }
}
