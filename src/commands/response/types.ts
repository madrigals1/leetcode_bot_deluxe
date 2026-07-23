import type { InlineKeyboard } from "grammy";
import type { InlineKeyboardButton } from "grammy/types";
import { LbContext } from "../../types/context";
import type { PaginatedResponse } from "../../services/api";

type ResponseType = "text" | "photo" | "paginatedText" | "paginatedButtons";

export interface BaseResponse {
  type?: ResponseType;
  reply_markup?: InlineKeyboard;
}

export interface TextResponse extends BaseResponse {
  type?: "text";
  text: string;
}

export interface PhotoResponse extends BaseResponse {
  type?: "photo";
  photo: string;
  caption?: string;
}

export interface PaginationBaseResponse<T = unknown> extends BaseResponse {
  name: string;
  fetchPage: (page: number, ctx: LbContext) => Promise<PaginatedResponse<T>>;
  itemsPerPage?: number;
  pageButtonsPerRow?: number;
  showPageNumbers?: boolean;
  showFirstLastButtons?: boolean;
}

export interface PaginatedTextResponse<T = unknown> extends PaginationBaseResponse<T> {
  type?: "paginatedText";
  header: string;
  formatItem: (item: T, index: number) => string;
}

export interface PaginatedButtonsResponse<T = unknown> extends PaginationBaseResponse<T> {
  type?: "paginatedButtons";
  itemToButton: (item: T) => InlineKeyboardButton;
  buttonsPerRow?: number;
}

export type CommandResponse =
  | TextResponse
  | PhotoResponse
  | PaginatedTextResponse<unknown>
  | PaginatedButtonsResponse<unknown>;
