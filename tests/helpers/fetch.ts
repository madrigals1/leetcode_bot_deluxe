import { vi } from "vitest";

export type FetchHandler = (
  url: string,
  init?: RequestInit,
) => Response | Promise<Response>;

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Stubs globalThis.fetch routing `/api/token/refresh/` to the refresh endpoint
 * (returning a fresh access token) and every other request to `handler`.
 * Records all calls so tests can assert paths, methods and bodies.
 */
export function mockBackendFetch(handler: FetchHandler) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
      calls.push({ url, init });

      if (url.endsWith("/api/token/refresh/")) {
        return jsonResponse(200, { access: "access-abc" });
      }

      return handler(url, init);
    },
  );

  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, calls };
}