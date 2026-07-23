import type { PaginatedResponse } from "@/services/api";
import { LbContext } from "@/types/context";
import type { PaginationBaseResponse } from "../types";

export interface RenderFirstPageOptions<T, R extends PaginationBaseResponse<T>> {
  lbCtx: LbContext;
  response: R;
  pageSize: number;
  buttonsPerRow?: number;
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
    buttonsPerRow?: number,
  ) => Promise<unknown>;
  defaultPageSize: number;
  defaultButtonsPerRow?: number;
}
