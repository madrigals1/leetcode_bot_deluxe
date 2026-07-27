import { Bot, Context } from "grammy";

import { LbContext } from "@/utils/context";
import { LeetCodeBotError, DataNotFoundError } from "@/errors";
import type { PaginationHandlerData } from "@/command/types";

export class PaginationRegistry {
  private static handlers = new Map<string, PaginationHandlerData>();

  static setBot(bot: Bot) {
    bot.callbackQuery(
      /^(\w+)_page:(\d+)$/,
      async (ctx: Context) => {
        const match = ctx.match as RegExpMatchArray | undefined;
        if (!match) {
          return;
        }

        const name = match[1];
        if (!name) {
          return;
        }

        const data = PaginationRegistry.handlers.get(name);
        if (!data) {
          return;
        }

        try {
          const lbCtx = new LbContext(ctx);
          const page = Number(match[2]);
          const fetchResult = await data.fetchPage(page, lbCtx);

          const fetchResults = (fetchResult as { results?: unknown[] }).results;
          if (!fetchResult || (Array.isArray(fetchResults) && fetchResults.length === 0)) {
            throw new DataNotFoundError();
          }

          const editReply = (text: string, options?: object) =>
            lbCtx.editMessageText(text, options);

          await data.renderPage(
            lbCtx,
            fetchResult,
            page,
            data.defaultPageSize,
            editReply,
            data.defaultButtonsPerRow,
          );
        } catch (error) {
          if (error instanceof LeetCodeBotError) {
            await ctx.answerCallbackQuery(error.message);
            return;
          }
          await ctx.editMessageText("Failed to fetch data.");
        }
      },
    );
  }

  static registerHandler(name: string, data: PaginationHandlerData) {
    PaginationRegistry.handlers.set(name, data);
  }
}
