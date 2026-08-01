import type {
  TextResponse,
  PhotoResponse,
  EditTextResponse,
  PaginatedTextResponse,
  PaginatedButtonsResponse,
} from "@/command/types";

export function text(text: string): TextResponse {
  return { text, type: "text" };
}

export function errorText(message: string): TextResponse {
  return text(`❗ ${message}`);
}

export function successText(message: string): TextResponse {
  return text(`✅ ${message}`);
}

export function buttons(options: Omit<TextResponse, "type">): TextResponse {
  return { ...options, type: "text" };
}

export function editText(options: Omit<EditTextResponse, "type">): EditTextResponse {
  return { ...options, type: "editText" };
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
