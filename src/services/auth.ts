import { ApiService } from "./api";

export interface LoginResponse {
  message: string;
  user: { id: number; url: string; username: string };
  tokens: { refresh: string; access: string };
}

class AuthService extends ApiService {
  login(username: string, password: string) {
    return this.fetch<LoginResponse>("/api/v1/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  logout(refreshToken: string) {
    return this.fetch<{ message: string }>("/api/v1/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  logoutAll() {
    return this.fetch<{ message: string; blacklisted_tokens: number }>(
      "/api/v1/auth/logout/",
      {
        method: "POST",
        body: JSON.stringify({ logout_all: true }),
      },
    );
  }
}

export const authService = new AuthService();
