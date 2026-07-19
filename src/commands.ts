import { Bot, Context, InlineKeyboard } from "grammy";
import {
  command,
  commandsRegisteredByDecorator,
} from "./decorators";

export default class Commands {
  @command({ name: "start" })
  static start() {
    return { text: "Welcome! I am the LeetCode Bot Deluxe." };
  }

  @command({ name: "help" })
  static help() {
    return { text: "Available commands: /start, /help, /menu" };
  }

  @command({ name: "menu" })
  static menu() {
    return { text: "Choose an option:", reply_markup: new InlineKeyboard()
      .text("LeetCode", "btn:leetcode")
      .text("Profile", "btn:profile")
      .row()
      .text("Help", "btn:help") };
  }
}

export function registerCommands(bot: Bot) {
  for (const cmd of commandsRegisteredByDecorator) {
    bot.command(cmd.name, async (ctx: Context) => {
      const result = await cmd.handler(ctx);
      await ctx.reply(result.text, {
        reply_markup: result.reply_markup,
      });
    });
  }

  bot.callbackQuery("btn:leetcode", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("Opening LeetCode...");
  });

  bot.callbackQuery("btn:profile", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("Opening Profile...");
  });

  bot.callbackQuery("btn:help", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("Help: Use /menu to see options.");
  });
}
