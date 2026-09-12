import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiService } from "./api_service";
import { BackendNotAvailableError } from "@/errors";
import { jsonResponse, mockBackendFetch } from "../../../tests/helpers/fetch";

interface RecordedCall {
  url: string;
  init?: RequestInit;
}

const isRefresh = (call: RecordedCall): boolean =>
  call.url.endsWith("/api/token/refresh/");

function resetState() {
  const api = ApiService as unknown as {
    cachedAccessToken?: string;
    lastRefreshedAt: number;
    refreshPromise?: Promise<string>;
  };
  api.cachedAccessToken = undefined;
  api.lastRefreshedAt = 0;
  api.refreshPromise = undefined;
}

beforeEach(() => {
  resetState();
});

afterEach(() => {
  resetState();
  vi.unstubAllGlobals();
});

describe("ApiService", () => {
  it("refreshes the access token on first use and caches it", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, { message: "ok" }));

    const data = await ApiService.fetch<{ message: string }>("/api/health");
    expect(data).toEqual({ message: "ok" });

    expect(calls.filter(isRefresh)).toHaveLength(1);
    const firstData = calls.find((c) => c.url.endsWith("/api/health"));
    expect(firstData?.init?.headers).toMatchObject({
      Authorization: "Bearer access-abc",
    });

    await ApiService.fetch("/api/health");
    expect(calls.filter(isRefresh)).toHaveLength(1);
  });

  it("deduplicates concurrent token refreshes", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, {}));

    await Promise.all([ApiService.fetch("/a"), ApiService.fetch("/b")]);

    expect(calls.filter(isRefresh)).toHaveLength(1);
    expect(calls.filter((c) => !isRefresh(c))).toHaveLength(2);
  });

  it("refreshes again after the cached token expires", async () => {
    vi.useFakeTimers();
    try {
      const { calls } = mockBackendFetch(() => jsonResponse(200, {}));

      await ApiService.fetch("/data");
      expect(calls.filter(isRefresh)).toHaveLength(1);

      vi.advanceTimersByTime(21 * 60 * 60 * 1000);
      await ApiService.fetch("/data");
      expect(calls.filter(isRefresh)).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("surfaces the backend error sentinel on HTTP errors", async () => {
    mockBackendFetch(() => jsonResponse(400, { error: "USER_ALREADY_IN_CHANNEL" }));
    await expect(ApiService.fetch("/x")).rejects.toThrow("USER_ALREADY_IN_CHANNEL");
  });

  it("falls back to the status code for unknown HTTP errors", async () => {
    mockBackendFetch(() => jsonResponse(500, {}));
    await expect(ApiService.fetch("/x")).rejects.toThrow("API error: 500");
  });

  it("maps refresh HTTP errors to a friendly message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403, {})));
    await expect(ApiService.fetch("/x")).rejects.toThrow(
      "Failed to refresh access token.",
    );
  });

  it("maps data network errors to BackendNotAvailableError", async () => {
    mockBackendFetch(() => {
      throw new TypeError("fetch failed");
    });
    await expect(ApiService.fetch("/x")).rejects.toBeInstanceOf(
      BackendNotAvailableError,
    );
  });

  it("maps refresh network errors to BackendNotAvailableError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));
    await expect(ApiService.fetch("/x")).rejects.toBeInstanceOf(
      BackendNotAvailableError,
    );
  });
});