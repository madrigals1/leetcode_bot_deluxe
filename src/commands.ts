import { Bot, Context, InlineKeyboard } from "grammy";
import {
  callback,
  callbacksRegisteredByDecorator,
  command,
  commandsRegisteredByDecorator,
  parseArgs,
} from "./decorators";
import { isOwnerOrPrivate } from "./utils/chat";

export default class Commands {
  @command({ name: "start" })
  static start() {
    return { text: "Welcome! I am the LeetCode Bot Deluxe." };
  }

  @command({ name: "help" })
  static help() {
    return { text: "Available commands: /start, /help, /menu, /ping" };
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
  static ping(_ctx: Context, args: Record<string, string>) {
    return { text: args.message };
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

      try {
        const args = parseArgs({ text: ctx.message?.text, defs: cmd.args });

        const result = await cmd.handler(ctx, args);
        await ctx.reply(result.text, {
          reply_markup: result.reply_markup,
        });
      } catch (error) {
        if (error instanceof Error) {
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
      const result = await cmd.handler(ctx, {});
      await ctx.editMessageText(result.text, {
        reply_markup: result.reply_markup,
      });
    }
  });
}

function findCommand(name: string) {
  return commandsRegisteredByDecorator.find((c) => c.name === name);
}
