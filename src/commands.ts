import { Bot, Context, InlineKeyboard } from "grammy";
import {
  callback,
  callbacksRegisteredByDecorator,
  command,
  commandsRegisteredByDecorator,
} from "./decorators";
import { isOwnerOrPrivate } from "./utils/chat";

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
        .text("Help", "command:help"),
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
}

export function registerCommands(bot: Bot) {
  for (const cmd of commandsRegisteredByDecorator) {
    bot.command(cmd.name, async (ctx: Context) => {
      if (cmd.isAdmin && !(await isOwnerOrPrivate(ctx))) {
        await ctx.reply("You don't have permission to use this command.");
        return;
      }

      const result = await cmd.handler(ctx);
      await ctx.reply(result.text, {
        reply_markup: result.reply_markup,
      });
    });
  }

  for (const cb of callbacksRegisteredByDecorator) {
    bot.callbackQuery(cb.action, async (ctx: Context) => {
      await ctx.answerCallbackQuery();
      await cb.handler(ctx);
    });
  }

  bot.callbackQuery(/^command:(.+)$/, async (ctx: Context) => {
    const match = ctx.match;
    if (!match) {
      return;
    }

    const name = match[1];
    const cmd = findCommand(name);
    if (cmd) {
      const result = await cmd.handler(ctx);
      await ctx.editMessageText(result.text, {
        reply_markup: result.reply_markup,
      });
    }
  });
}

function findCommand(name: string) {
  return commandsRegisteredByDecorator.find((c) => c.name === name);
}
