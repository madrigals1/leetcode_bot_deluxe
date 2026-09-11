export const REQUEST_TIMEOUT_MS = 15_000;

export interface HttpJsonOptions {
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
  httpOptions: HttpJsonOptions = {},
): Promise<T> {
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
    throw httpOptions.onNetworkError?.() ?? new Error("Network error.");
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      // response body is not valid JSON
    }

    const message =
      httpOptions.onHttpError?.(response, body)
      ?? `HTTP error: ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}