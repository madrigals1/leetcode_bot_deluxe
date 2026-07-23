import type {
  EditTextResponse,
  EditPhotoResponse,
  CommandRedirectResponse,
} from "./types";

export function editText(text: string): EditTextResponse {
  return { text, type: "editText" };
}

export function editComplexText(options: Omit<EditTextResponse, "type">): EditTextResponse {
  return { ...options, type: "editText" };
}

export function editPhoto(options: Omit<EditPhotoResponse, "type">): EditPhotoResponse {
  return { ...options, type: "editPhoto" };
}

export function commandRedirect(command: string): CommandRedirectResponse {
  return { type: "commandRedirect", command };
}
