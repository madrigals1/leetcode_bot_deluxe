import { ApiService } from "./api_service";
import type { AdminData } from "./types";

export class AdminService {
  static getData() {
    return ApiService.fetch<AdminData>("/api/v1/admin/data/");
  }
}
