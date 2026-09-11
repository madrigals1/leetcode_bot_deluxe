import {
  BACKEND_URL,
  BACKEND_JWT_REFRESH_TOKEN,
  TOKEN_MAX_AGE_MS,
} from "@/constants";
import { BackendNotAvailableError } from "@/errors";
import { httpJson } from "@/utils/http";

export class ApiService {
  private static cachedAccessToken?: string;
  private static lastRefreshedAt = 0;
  private static refreshPromise?: Promise<string>;

  private static async doRefreshAccessToken(): Promise<string> {
    const data = await httpJson<{ access: string }>(
      `${BACKEND_URL}/api/token/refresh/`,
      {
        method: "POST",
        body: JSON.stringify({ refresh: BACKEND_JWT_REFRESH_TOKEN }),
      },
      {
        onNetworkError: () => new BackendNotAvailableError(),
        onHttpError: () => "Failed to refresh access token.",
      },
    );

    ApiService.cachedAccessToken = data.access;
    ApiService.lastRefreshedAt = Date.now();
    return ApiService.cachedAccessToken;
  }

  private static refreshAccessToken(): Promise<string> {
    if (!ApiService.refreshPromise) {
      ApiService.refreshPromise = ApiService.doRefreshAccessToken().finally(
        () => {
          ApiService.refreshPromise = undefined;
        },
      );
    }

    return ApiService.refreshPromise;
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

    return httpJson<T>(`${BACKEND_URL}${path}`, options, {
      headers: { Authorization: `Bearer ${token}` },
      onNetworkError: () => new BackendNotAvailableError(),
      onHttpError: (response, body) =>
        (body as { error?: string })?.error ?? `API error: ${response.status}`,
    });
  }
}