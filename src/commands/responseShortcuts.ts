import { InlineKeyboard } from "grammy";
import type { InlineKeyboardButton } from "grammy/types";
import type { PaginatedResponse } from "../services/api";
import { LbContext } from "../types/context";
import type {
  TextResponse,
  PhotoResponse,
  PaginatedTextResponse,
  PaginatedButtonsResponse,
} from "./commandResponseTypes";

export function text(text: string): TextResponse {
  return { text, type: "text" };
}

export function complexText(options: { text: string; reply_markup?: InlineKeyboard }): TextResponse {
  return { ...options, type: "text" };
}

export function photo(options: { photo: string; caption?: string; reply_markup?: InlineKeyboard }): PhotoResponse {
  return { ...options, type: "photo" };
}

export function paginatedText<T>(options: {
  name: string;
  header: string;
  fetchPage: (page: number, ctx: LbContext) => Promise<PaginatedResponse<T>>;
  formatItem: (item: T, index: number) => string;
  reply_markup?: InlineKeyboard;
  itemsPerPage?: number;
  pageButtonsPerRow?: number;
  showPageNumbers?: boolean;
  showFirstLastButtons?: boolean;
}): PaginatedTextResponse<T> {
  return { ...options, type: "paginatedText" };
}

export function paginatedButtons<T>(options: {
  name: string;
  fetchPage: (page: number, ctx: LbContext) => Promise<PaginatedResponse<T>>;
  itemToButton: (item: T) => InlineKeyboardButton;
  buttonsPerRow?: number;
  reply_markup?: InlineKeyboard;
  itemsPerPage?: number;
  pageButtonsPerRow?: number;
  showPageNumbers?: boolean;
  showFirstLastButtons?: boolean;
}): PaginatedButtonsResponse<T> {
  return { ...options, type: "paginatedButtons" };
}
