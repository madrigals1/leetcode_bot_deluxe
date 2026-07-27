import { Bot, Context } from "grammy";
import { LeetCodeBotError } from "@/errors";
import { RequireBot } from "@/utils/decorators";

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

  @RequireBot
  static registerCallback(metadata: CallbackMetadata) {
    CallbackRegistry.callbacks.push(metadata);
    CallbackRegistry.registerWithBot(metadata);
  }

  @RequireBot
  static registerAllCallbacks() {
    for (const cb of CallbackRegistry.callbacks) {
      CallbackRegistry.registerWithBot(cb);
    }
  }

  static findByAction(action: RegExp) {
    return CallbackRegistry.callbacks.find(
      (c) =>
        c.action instanceof RegExp && c.action.source === action.source,
    );
  }

  static getAll() {
    return CallbackRegistry.callbacks;
  }

  private static registerWithBot(metadata: CallbackMetadata) {
    CallbackRegistry.bot!.callbackQuery(metadata.action, async (ctx) => {
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
