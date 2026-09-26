import type { Bot, Context } from "grammy";
import { BotNotInitializedError, LeetCodeBotError } from "@/errors";
import { callbacksTotal } from "@/metrics";

export interface CallbackMetadata {
  action: string | RegExp;
  handler: (ctx: Context) => void | Promise<void>;
}

export class CallbackRegistry {
  private static bot?: Bot;
  private static callbacks: CallbackMetadata[] = [];

  static setBot(bot: Bot) {
    CallbackRegistry.bot = bot;
  }

  static addCallback(metadata: CallbackMetadata) {
    CallbackRegistry.callbacks.push(metadata);
  }

  static registerAllCallbacks() {
    const bot = CallbackRegistry.requireBot();
    for (const cb of CallbackRegistry.callbacks) {
      CallbackRegistry.registerWithBot(bot, cb);
    }
  }

  static getAll() {
    return CallbackRegistry.callbacks;
  }

  private static requireBot(): Bot {
    const bot = CallbackRegistry.bot;
    if (!bot) {
      throw new BotNotInitializedError();
    }
    return bot;
  }

  private static registerWithBot(bot: Bot, metadata: CallbackMetadata) {
    const action =
      typeof metadata.action === "string"
        ? metadata.action
        : metadata.action.source;

    bot.callbackQuery(metadata.action, async (ctx) => {
      callbacksTotal.inc({ action });

      try {
        await metadata.handler(ctx);
      } catch (error) {
        if (error instanceof LeetCodeBotError) {
          await ctx.editMessageText(error.message);
          return;
        }

        await ctx.editMessageText("An error occurred.");
      }
    });
  }
}
