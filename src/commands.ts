import { Bot, Context, InlineKeyboard } from "grammy";
import {
  callback,
  callbacksRegisteredByDecorator,
  command,
  commandsRegisteredByDecorator,
} from "@/decorators";
import type { ParsedArgs } from "@/decorators";
import { LeetCodeBotError } from "@/errors";
import { Service } from "@/services";
import { LbContext } from "@/types/context";
import { getDifficultyCount } from "@/utils/leetcode";
import {
  CML_EASY_POINTS,
  CML_MEDIUM_POINTS,
  CML_HARD_POINTS,
} from "@/constants";
import {
  text,
  paginatedText,
  paginatedButtons,
} from "@/commands/response/shortcuts";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}

export default class Commands {
  @command({ name: "start" })
  static start() {
    return text("Welcome! I am the LeetCode Bot Deluxe.");
  }

  @command({ name: "help" })
  static help() {
    return text("Available commands: /start, /help, /menu, /ping, /add, /remove, /rating");
  }

  @command({
    name: "add",
    args: [{ name: "username" }],
  })
  static async add(ctx: LbContext, parsedArgs: ParsedArgs) {
    try {
      await Service.users.addToChannel(parsedArgs.username, ctx.chatId);
      return text(`User ${parsedArgs.username} was successfully added.`);
    } catch {
      return text(`Failed to add user ${parsedArgs.username}.`);
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
      return text(`User ${parsedArgs.username} was successfully removed.`);
    } catch {
      return text(`Failed to remove user ${parsedArgs.username}.`);
    }
  }

  @command({ name: "rating" })
  static rating() {
    return paginatedText({
      name: "rating",
      header: "Rating  🏆",
      fetchPage: (page, ctx) => Service.channels.getUsers(ctx.chatId, page),
      formatItem: (item, i) => `${i + 1}. <b>${item.user.username}</b> ${item.user.solved}`,
      reply_markup: new InlineKeyboard().text("🔥 Cumulative rating", "command:rating_cml"),
    });
  }

  @command({ name: "rating_cml" })
  static ratingCml() {
    return paginatedText({
      name: "rating_cml",
      header:
        "Cumulative Rating  🔥\n" +
        `🟢 Easy - ${CML_EASY_POINTS} points\n` +
        `🟡 Medium - ${CML_MEDIUM_POINTS} points\n` +
        `🔴 Hard - ${CML_HARD_POINTS} points`,
      fetchPage: (page, ctx) => Service.channels.getUsers(ctx.chatId, page, "-user__solved_cml"),
      formatItem: (item, i) => `${i + 1}. <b>${item.user.username}</b> ${item.user.solved_cml}`,
      reply_markup: new InlineKeyboard().text("🏆 Regular rating", "command:rating"),
    });
  }

  @command({ name: "profile" })
  static profile() {
    return paginatedButtons({
      name: "profile",
      fetchPage: (page, ctx) => Service.channels.getUsers(ctx.chatId, page),
      itemToButton: (item) => ({ text: item.user.username, callback_data: `profile:${item.user.id}` }),
      buttonsPerRow: 2,
    });
  }

  @command({ name: "avatar" })
  static avatar() {
    return paginatedButtons({
      name: "avatar",
      fetchPage: (page, ctx) => Service.channels.getUsers(ctx.chatId, page),
      itemToButton: (item) => ({ text: item.user.username, callback_data: `avatar:${item.user.id}` }),
      buttonsPerRow: 2,
    });
  }

  @command({ name: "langstats" })
  static langstats() {
    return paginatedButtons({
      name: "langstats",
      fetchPage: (page, ctx) => Service.channels.getUsers(ctx.chatId, page),
      itemToButton: (item) => ({ text: item.user.username, callback_data: `langstats:${item.user.id}` }),
      buttonsPerRow: 2,
    });
  }

  @callback({ action: /^profile:(\d+)$/ })
  static async onProfileUser(lbctx: LbContext) {
    const userId = Number(lbctx.match[1]);
    const user = await Service.users.getById(userId);
    const name = user.data?.profile?.realName ?? user.username;
    const solved = user.data?.submitStats?.acSubmissionNum ?? [];
    const total = user.data?.submitStats?.totalSubmissionNum ?? [];

    const text =
      `<b>${escapeHtml(name)}</b> - https://leetcode.com/${user.username}\n\n` +
      "<b>Solved Problems:</b>\n" +
      `🟢 Easy - ${getDifficultyCount(solved, "Easy")}\n` +
      `🟡 Medium - ${getDifficultyCount(solved, "Medium")}\n` +
      `🔴 Hard - ${getDifficultyCount(solved, "Hard")}\n` +
      `🔵 All - ${getDifficultyCount(solved, "All")} / ${getDifficultyCount(total, "All")}\n` +
      `🔷 Cumulative - ${user.solved_cml}`;

    await lbctx.editMessageText(text);
  }

  @callback({ action: /^avatar:(\d+)$/ })
  static async onAvatarUser(lbctx: LbContext) {
    const userId = Number(lbctx.match[1]);
    const user = await Service.users.getById(userId);
    const avatarUrl = user.data?.profile?.userAvatar;

    if (avatarUrl) {
      await lbctx.ctx.editMessageMedia({
        type: "photo",
        media: avatarUrl,
      });
    } else {
      await lbctx.editMessageText("No avatar found.");
    }
  }

  @callback({ action: /^langstats:(\d+)$/ })
  static async onLangStatsUser(lbctx: LbContext) {
    const userId = Number(lbctx.match[1]);
    const user = await Service.users.getById(userId);
    const stats = user.data?.languageStats ?? [];

    const text =
      `👨‍💻 Problems solved by <b>${escapeHtml(user.username)}</b> in:\n\n` +
      stats
        .sort((a, b) => b.problemsSolved - a.problemsSolved)
        .map((s) => `- <b>${s.languageName}</b> ${s.problemsSolved}`)
        .join("\n");

    await lbctx.editMessageText(text);
  }

  @callback({ action: /^command:(.+)$/ })
  static async onCommandRedirect(lbctx: LbContext) {
    const name = lbctx.match[1];
    const cmd = commandsRegisteredByDecorator.find((c) => c.name === name);
    if (cmd) {
      await cmd.handler(lbctx.ctx);
    }
  }
}

export function registerCommands(bot: Bot) {
  bot.api.config.use((prev, method, payload) => {
    if (
      typeof payload === "object" &&
      payload !== null &&
      !("parse_mode" in payload)
    ) {
      (payload as Record<string, unknown>).parse_mode = "HTML";
    }
    return prev(method, payload);
  });

  for (const cmd of commandsRegisteredByDecorator) {
    bot.command(cmd.name, async (ctx: Context) => {
      try {
        await cmd.handler(ctx);
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
