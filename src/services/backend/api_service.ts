import {
  BACKEND_URL,
  BACKEND_JWT_REFRESH_TOKEN,
  TOKEN_MAX_AGE_MS,
} from "@/constants";
import { BackendApiError, BackendNotAvailableError } from "@/errors";
import { httpJson } from "@/utils/http";

const SENTINEL_CODE_PATTERN = /[A-Z][A-Z0-9_]+/;

function extractBackendErrorCode(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }

  const raw =
    (body as { error?: unknown }).error
    ?? (body as { detail?: unknown }).detail;

  if (typeof raw !== "string") {
    return undefined;
  }

  return raw.match(SENTINEL_CODE_PATTERN)?.[0];
}

function backendError(body: unknown, status: number): BackendApiError {
  if (typeof body === "object" && body !== null) {
    const raw =
      (body as { error?: unknown }).error
      ?? (body as { detail?: unknown }).detail;

    if (typeof raw === "string") {
      return new BackendApiError(raw, extractBackendErrorCode(body), status);
    }
  }

  return new BackendApiError(`API error: ${status}`, undefined, status);
}

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
        service: "backend",
        path: "/api/token/refresh/",
        onNetworkError: () => new BackendNotAvailableError(),
        onHttpError: (response, body) =>
          new BackendApiError(
            "Failed to refresh access token.",
            extractBackendErrorCode(body),
            response.status,
          ),
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
      service: "backend",
      path,
      headers: { Authorization: `Bearer ${token}` },
      onNetworkError: () => new BackendNotAvailableError(),
      onHttpError: (response, body) => backendError(body, response.status),
    });
  }
}