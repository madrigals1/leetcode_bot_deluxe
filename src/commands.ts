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
import { pagination } from "./utils/pagination";

export default class Commands {
  @command({ name: "start" })
  static start() {
    return { text: "Welcome! I am the LeetCode Bot Deluxe." };
  }

  @command({ name: "help" })
  static help() {
    return {
      text: "Available commands: /start, /help, /menu, /ping, /add, /remove, /rating",
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

  @pagination({
    name: "rating",
    title: "LeetCode Rating:",
    fetchPage: (page, ctx) =>
      Service.users.list({
        channel_chat_id: ctx.chatId,
        page,
      }),
    formatItem: (user, i) =>
      `${i + 1}. <b>${user.username}</b> ${user.solved}`,
  })
  static rating() {}

  @callback({ action: /^command:(.+)$/ })
  static async onCommandRedirect(lbctx: LbContext) {
    if (!lbctx.match) {
      return;
    }

    const name = lbctx.match[1];
    const cmd = findCommand(name);
    if (cmd) {
      const result = await cmd.handler(lbctx.ctx);
      await lbctx.editMessageText(result.text, {
        reply_markup: result.reply_markup,
      });
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
  bot.api.config.use((prev, method, payload) => {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "parse_mode" in payload === false
    ) {
      (payload as Record<string, unknown>).parse_mode = "HTML";
    }
    return prev(method, payload);
  });

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
}

function findCommand(name: string) {
  return commandsRegisteredByDecorator.find((c) => c.name === name);
}
