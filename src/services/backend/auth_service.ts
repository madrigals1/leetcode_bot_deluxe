import { ApiService } from "./api_service";
import type { LoginResponse } from "./types";

export class AuthService {
  static login(username: string, password: string) {
    return ApiService.fetch<LoginResponse>("/api/v1/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  static logout(refreshToken: string) {
    return ApiService.fetch<{ message: string }>("/api/v1/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  static logoutAll() {
    return ApiService.fetch<{ message: string; blacklisted_tokens: number }>(
      "/api/v1/auth/logout/",
      {
        method: "POST",
        body: JSON.stringify({ logout_all: true }),
      },
    );
  }
}
