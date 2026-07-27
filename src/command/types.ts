import type { InlineKeyboard } from "grammy";
import type { InlineKeyboardButton } from "grammy/types";
import type { Context } from "grammy";
import { LbContext } from "@/utils/context";
import type { PaginatedResponse } from "@/services/backend/api";

// ── Argument types ──

export type ParsedArgs = Record<string, string>;

export interface CommandArg {
  name: string;
  optional?: boolean;
}

// ── Decorator types ──

export interface CommandOptions {
  name: string;
  description: string;
  args?: CommandArg[];
  requiresAdmin?: boolean;
}

// ── Registry types ──

export interface CommandMetadata extends CommandOptions {
  handler: (ctx: Context) => CommandResponse | Promise<CommandResponse>;
  originalFn: (...args: unknown[]) => CommandResponse | Promise<CommandResponse>;
}

// ── Response types ──

type ResponseType = "text" | "photo" | "paginatedText" | "paginatedButtons";

export interface BaseResponse {
  type: ResponseType;
  buttons?: InlineKeyboard;
}

export interface TextResponse extends BaseResponse {
  type: "text";
  text: string;
}

export interface PhotoResponse extends BaseResponse {
  type: "photo";
  photo: string;
  caption?: string;
}

export interface PaginationBaseResponse<T = unknown> extends BaseResponse {
  name: string;
  fetchPage: (page: number, ctx: LbContext) => Promise<PaginatedResponse<T>>;
  itemsPerPage?: number;
}

export interface PaginatedTextResponse<T = unknown> extends PaginationBaseResponse<T> {
  type: "paginatedText";
  header: string;
  formatItem: (item: T, index: number) => string;
}

export interface PaginatedButtonsResponse<T = unknown> extends PaginationBaseResponse<T> {
  type: "paginatedButtons";
  text?: string;
  itemToButton: (item: T) => InlineKeyboardButton;
  buttonsPerRow?: number;
}

export type CommandResponse =
  | TextResponse
  | PhotoResponse
  | PaginatedTextResponse<unknown>
  | PaginatedButtonsResponse<unknown>;

// ── Pagination dispatch types ──

export type ReplyMethod = (text: string, options?: object) => Promise<unknown>;
export type ReplyPhotoMethod = (photo: string, options?: object) => Promise<unknown>;

export interface RenderFirstPageOptions<T, R extends PaginationBaseResponse<T>> {
  lbCtx: LbContext;
  response: R;
  pageSize: number;
  buttonsPerRow?: number;
  reply: ReplyMethod;
}

export interface RenderPageOptions<T, R extends PaginationBaseResponse<T>>
  extends RenderFirstPageOptions<T, R> {
  data: PaginatedResponse<T>;
  page: number;
}

export interface RegisterPaginationCallbackOptions<T> {
  name: string;
  fetchPage: (page: number, ctx: LbContext) => Promise<PaginatedResponse<T>>;
  renderPage: (
    lbCtx: LbContext,
    data: PaginatedResponse<T>,
    page: number,
    pageSize: number,
    reply: ReplyMethod,
    buttonsPerRow?: number,
  ) => Promise<unknown>;
  defaultPageSize: number;
  defaultButtonsPerRow?: number;
  reply: ReplyMethod;
}

export type PaginationHandlerData = Omit<RegisterPaginationCallbackOptions<unknown>, "name">;
