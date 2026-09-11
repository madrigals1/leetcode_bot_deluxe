import { apiErrorsTotal, apiRequestsTotal } from "@/metrics";

export const REQUEST_TIMEOUT_MS = 15_000;

export interface HttpJsonOptions {
  service: string;
  path?: string;
  headers?: Record<string, string>;
  onNetworkError?: () => Error;
  onHttpError?: (response: Response, body: unknown) => string;
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function httpJson<T>(
  url: string,
  requestOptions: RequestInit = {},
  httpOptions: HttpJsonOptions,
): Promise<T> {
  const { service, path = url } = httpOptions;

  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      ...requestOptions,
      headers: {
        "Content-Type": "application/json",
        ...httpOptions.headers,
        ...requestOptions.headers,
      },
    });
  } catch {
    apiErrorsTotal.inc({ service, kind: "network" });
    throw httpOptions.onNetworkError?.() ?? new Error("Network error.");
  }

  apiRequestsTotal.inc({
    service,
    method: requestOptions.method ?? "GET",
    path,
    status: String(response.status),
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      // response body is not valid JSON
    }

    apiErrorsTotal.inc({ service, kind: "http" });

    const message =
      httpOptions.onHttpError?.(response, body)
      ?? `HTTP error: ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}