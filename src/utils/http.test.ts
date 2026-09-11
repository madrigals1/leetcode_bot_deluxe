import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithTimeout, httpJson, REQUEST_TIMEOUT_MS } from "./http";

const mocks = vi.hoisted(() => ({
  apiRequestsTotal: { inc: vi.fn() },
  apiErrorsTotal: { inc: vi.fn() },
}));

vi.mock("@/metrics", () => ({
  apiRequestsTotal: mocks.apiRequestsTotal,
  apiErrorsTotal: mocks.apiErrorsTotal,
}));

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    mocks.apiErrorsTotal.inc.mockClear();
  });

  it("forwards the URL and an abort signal to fetch", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);

    await fetchWithTimeout("http://example.com/api");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://example.com/api",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("aborts the request after the timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError")),
            );
          }) as Promise<Response>,
      ),
    );

    const pending = fetchWithTimeout("http://example.com/slow");
    const assertion = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await assertion;
  });
});

describe("httpJson", () => {
  beforeEach(() => {
    mocks.apiRequestsTotal.inc.mockClear();
    mocks.apiErrorsTotal.inc.mockClear();
  });

  it("returns the parsed body and records the request", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(200, { ok: true })));

    const result = await httpJson(
      "http://backend/api/v1/channels/42/users/simplified/",
      { method: "GET" },
      { service: "backend", path: "/api/v1/channels/42/users/simplified/" },
    );

    expect(result).toEqual({ ok: true });
    expect(mocks.apiRequestsTotal.inc).toHaveBeenCalledWith({
      service: "backend",
      method: "GET",
      path: "/api/v1/channels/42/users/simplified/",
      status: "200",
    });
  });

  it("merges custom headers with the JSON content type", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, {}));
    vi.stubGlobal("fetch", fetchMock);

    await httpJson(
      "http://backend/api",
      { method: "POST", headers: { Authorization: "Bearer abc" } },
      { service: "backend", headers: { "X-Custom": "yes" } },
    );

    const sentHeaders = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(sentHeaders).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer abc",
      "X-Custom": "yes",
    });
  });

  it("surfaces onHttpError messages for HTTP failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(404, { error: "NOPE" })));

    const error = await httpJson(
      "http://backend/api",
      {},
      {
        service: "backend",
        onHttpError: (response) => `failed with ${response.status}`,
      },
    ).catch((err: Error) => err);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("failed with 404");
    expect(mocks.apiErrorsTotal.inc).toHaveBeenCalledWith({
      service: "backend",
      kind: "http",
    });
  });

  it("falls back to a default message when no onHttpError given", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(500, {})));

    const error = await httpJson("http://backend/api", {}, { service: "backend" })
      .catch((err: Error) => err);

    expect((error as Error).message).toBe("HTTP error: 500");
  });

  it("passes an undefined body when the error response is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("not json");
        },
      }) as Response),
    );

    const error = await httpJson(
      "http://backend/api",
      {},
      {
        service: "backend",
        onHttpError: (_response, body) => `body=${String(body)}`,
      },
    ).catch((err: Error) => err);

    expect((error as Error).message).toBe("body=undefined");
  });

  it("maps network failures through onNetworkError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    const error = await httpJson(
      "http://backend/api",
      {},
      {
        service: "backend",
        onNetworkError: () => new Error("Backend unreachable"),
      },
    ).catch((err: Error) => err);

    expect((error as Error).message).toBe("Backend unreachable");
    expect(mocks.apiErrorsTotal.inc).toHaveBeenCalledWith({
      service: "backend",
      kind: "network",
    });
  });
});