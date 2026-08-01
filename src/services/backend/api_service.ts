import {
  BACKEND_URL,
  BACKEND_JWT_REFRESH_TOKEN,
  TOKEN_MAX_AGE_MS,
} from "@/constants";
import { BackendNotAvailableError } from "@/errors";

export class ApiService {
  private static cachedAccessToken?: string;
  private static lastRefreshedAt = 0;

  private static async refreshAccessToken(): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: BACKEND_JWT_REFRESH_TOKEN }),
      });
    } catch {
      throw new BackendNotAvailableError();
    }

    if (!response.ok) {
      throw new Error("Failed to refresh access token.");
    }

    const data = await response.json();
    ApiService.cachedAccessToken = data.access as string;
    ApiService.lastRefreshedAt = Date.now();
    return ApiService.cachedAccessToken;
  }

  private static async getAccessToken(): Promise<string> {
    if (
      ApiService.cachedAccessToken &&
      Date.now() - ApiService.lastRefreshedAt < TOKEN_MAX_AGE_MS
    ) {
      return ApiService.cachedAccessToken;
    }

    return ApiService.refreshAccessToken();
  }

  static async fetch<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await ApiService.getAccessToken();

    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
    } catch {
      throw new BackendNotAvailableError();
    }

    if (!response.ok) {
      let body = { error: undefined };

      try {
        body = await response.json();
      } catch {
        // response body is not valid JSON
      }

      throw new Error(body.error ?? `API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}
