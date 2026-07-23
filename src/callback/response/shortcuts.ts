import type {
  EditTextResponse,
  EditPhotoResponse,
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
