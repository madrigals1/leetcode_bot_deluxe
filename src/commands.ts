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
import { pagination, buttonsPagination } from "./utils/pagination";
import { CUMULATIVE_RATING_HEADER } from "./messages";
import { getDifficultyCount } from "./utils/leetcode";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
    header: "Rating  🏆",
    fetchPage: (page, ctx) =>
      Service.channels.getUsers(ctx.chatId, page),
    formatItem: (item, i) =>
      `${i + 1}. <b>${item.user.username}</b> ${item.user.solved}`,
    reply_markup: new InlineKeyboard().text("🔥 Cumulative rating", "command:rating_cml"),
  })
  static rating() {}

  @pagination({
    name: "rating_cml",
    header: CUMULATIVE_RATING_HEADER,
    fetchPage: (page, ctx) =>
      Service.channels.getUsers(ctx.chatId, page, "-user__solved_cml"),
    formatItem: (item, i) =>
      `${i + 1}. <b>${item.user.username}</b> ${item.user.solved_cml}`,
    reply_markup: new InlineKeyboard().text("🏆 Regular rating", "command:rating"),
  })
  static ratingCml() {}

  @buttonsPagination({
    name: "profile",
    header: "Select a user to see the profile:",
    fetchPage: (page, ctx) =>
      Service.channels.getUsers(ctx.chatId, page),
    buttonsPerRow: 2,
    itemToButton: (item) => ({
      text: item.user.username,
      callback_data: `profile:${item.user.id}`,
    }),
  })
  static profile() {}

  @callback({ action: /^profile:(\d+)$/ })
  static async onProfileUser(lbctx: LbContext) {
    if (!lbctx.match) {
      return;
    }

    const userId = Number(lbctx.match[1]);
    const user = await Service.users.getById(userId);
    const name = user.data?.profile?.realName ?? user.username;
    const ac = user.data?.submitStats?.acSubmissionNum ?? [];
    const total = user.data?.submitStats?.totalSubmissionNum ?? [];

    const easy = getDifficultyCount(ac, "Easy");
    const medium = getDifficultyCount(ac, "Medium");
    const hard = getDifficultyCount(ac, "Hard");
    const allSolved = getDifficultyCount(ac, "All");
    const allTotal = getDifficultyCount(total, "All");
    const cumulative = user.solved_cml;

    const text =
      `<b>${escapeHtml(name)}</b> - https://leetcode.com/${user.username}\n\n` +
      "<b>Solved Problems:</b>\n" +
      `🟢 Easy - ${easy}\n` +
      `🟡 Medium - ${medium}\n` +
      `🔴 Hard - ${hard}\n` +
      `🔵 All - ${allSolved} / ${allTotal}\n` +
      `🔷 Cumulative - ${cumulative}`;

    await lbctx.editMessageText(text);
  }

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
