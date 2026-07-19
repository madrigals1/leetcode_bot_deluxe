import { Bot, Context, InlineKeyboard } from "grammy";
import {
  callback,
  callbacksRegisteredByDecorator,
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
    return {
      text: "Choose an option:",
      reply_markup: new InlineKeyboard()
        .text("LeetCode", "btn:leetcode")
        .text("Profile", "btn:profile")
        .row()
        .text("Help", "btn:help"),
    };
  }

  @callback({ action: "btn:leetcode" })
  static onLeetCode(ctx: Context) {
    ctx.answerCallbackQuery();
    ctx.editMessageText("Opening LeetCode...");
  }

  @callback({ action: "btn:profile" })
  static onProfile(ctx: Context) {
    ctx.answerCallbackQuery();
    ctx.editMessageText("Opening Profile...");
  }

  @callback({ action: "btn:help" })
  static onHelp(ctx: Context) {
    ctx.answerCallbackQuery();
    ctx.editMessageText("Help: Use /menu to see options.");
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

  for (const cb of callbacksRegisteredByDecorator) {
    bot.callbackQuery(cb.action, async (ctx: Context) => {
      await cb.handler(ctx);
    });
  }
}
