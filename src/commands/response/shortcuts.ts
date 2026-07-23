import type {
  TextResponse,
  PhotoResponse,
  PaginatedTextResponse,
  PaginatedButtonsResponse,
} from "./types";

export function text(text: string): TextResponse {
  return { text, type: "text" };
}

export function complexText(options: Omit<TextResponse, "type">): TextResponse {
  return { ...options, type: "text" };
}

export function photo(options: Omit<PhotoResponse, "type">): PhotoResponse {
  return { ...options, type: "photo" };
}

export function paginatedText<T>(options: Omit<PaginatedTextResponse<T>, "type">): PaginatedTextResponse<T> {
  return { ...options, type: "paginatedText" };
}

export function paginatedButtons<T>(options: Omit<PaginatedButtonsResponse<T>, "type">): PaginatedButtonsResponse<T> {
  return { ...options, type: "paginatedButtons" };
}
