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
    return {
      text: "Available commands: /start, /help, /menu, /ping, /add, /remove",
    };
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
  static async add(ctx: LbContext, parsedArgs: ParsedArgs) {
    try {
      await Service.users.addToChannel(parsedArgs.username, ctx.chatId);
      return { text: `User ${parsedArgs.username} was successfully added.` };
    } catch {
      return { text: `Failed to add user ${parsedArgs.username}.` };
    }
  }

  @command({
    name: "remove",
    args: [{ name: "username" }],
    requiresAdmin: true,
  })
  static async remove(ctx: LbContext, parsedArgs: ParsedArgs) {
    try {
      await Service.users.removeFromChannel(parsedArgs.username, ctx.chatId);
      return { text: `User ${parsedArgs.username} was successfully removed.` };
    } catch {
      return { text: `Failed to remove user ${parsedArgs.username}.` };
    }
  }

  @command({ name: "rating" })
  static async rating(ctx: LbContext) {
    try {
      const { results } = await Service.users.list({
        channel_chat_id: ctx.chatId,
      });

      if (results.length === 0) {
        return { text: "No users found in this channel." };
      }

      const lines = results.map(
        (user, i) => `${i + 1}. ${user.username}: ${user.solved}`,
      );

      return { text: lines.join("\n") };
    } catch {
      return { text: "Failed to fetch rating." };
    }
  }

  @callback({ action: "btn:leetcode" })
  static async onLeetCode(ctx: LbContext) {
    await ctx.editMessageText("Opening LeetCode...");
  }

  @callback({ action: "btn:profile" })
  static async onProfile(ctx: LbContext) {
    await ctx.editMessageText("Opening Profile...");
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
