import { Bot, Context, InlineKeyboard } from "grammy";
import {
  callback,
  callbacksRegisteredByDecorator,
  command,
  commandsRegisteredByDecorator,
} from "./decorators";
import type { ParsedArgs } from "./decorators";
import { LeetCodeBotError } from "./errors";
import { Service } from "./services";
import { LbContext } from "./types/context";

export default class Commands {
  @command({ name: "start" })
  static start() {
    return { text: "Welcome! I am the LeetCode Bot Deluxe." };
  }

  @command({ name: "help" })
  static help() {
    return { text: "Available commands: /start, /help, /menu, /ping, /add" };
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

  @command({
    name: "ping",
    args: [{ name: "message" }],
  })
  static ping(_ctx: LbContext, parsedArgs: ParsedArgs) {
    return { text: parsedArgs.message };
  }

  @command({
    name: "add",
    args: [{ name: "username" }],
  })
  static add(ctx: LbContext, parsedArgs: ParsedArgs) {
    return Service.users
      .addToChannel(parsedArgs.username, ctx.chatId)
      .then(() => ({
        text: `User ${parsedArgs.username} was successfully added.`,
      }))
      .catch(() => ({
        text: `Failed to add user ${parsedArgs.username}.`,
      }));
  }

  @callback({ action: "btn:leetcode" })
  static onLeetCode(ctx: LbContext) {
    ctx.answerCallbackQuery();
    ctx.editMessageText("Opening LeetCode...");
  }

  @callback({ action: "btn:profile" })
  static onProfile(ctx: LbContext) {
    ctx.answerCallbackQuery();
    ctx.editMessageText("Opening Profile...");
  }
}

export function registerCommands(bot: Bot) {
  for (const cmd of commandsRegisteredByDecorator) {
    bot.command(cmd.name, async (ctx: Context) => {
      try {
        const result = await cmd.handler(ctx);
        await ctx.reply(result.text, {
          reply_markup: result.reply_markup,
        });
      } catch (error) {
        if (error instanceof LeetCodeBotError) {
          await ctx.reply(error.message);
          return;
        }

        await ctx.reply("An error occurred.");
      }
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
