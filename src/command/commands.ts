import { Bot, Context, InlineKeyboard } from "grammy";
import {
  command,
} from "@/command/decorator";
import type { ParsedArgs } from "@/command/decorator";
import { COMMANDS_TO_REGISTER } from "@/command/registry";
import { LeetCodeBotError } from "@/errors";
import { Service } from "@/services";
import { LbContext } from "@/utils/context";
import {
  CML_EASY_POINTS,
  CML_MEDIUM_POINTS,
  CML_HARD_POINTS,
} from "@/constants";
import {
  text,
  paginatedText,
  paginatedButtons,
} from "@/command/response/shortcuts";

export default class Commands {
  @command({ name: "start", description: "🚀 Start the bot" })
  static start() {
    return text("Welcome to the LeetCode BOT.\n\nUse /help to see available commands.");
  }

  @command({ name: "help", description: "❓ Show this help message" })
  static help() {
    const commands = COMMANDS_TO_REGISTER
      .filter((cmd) => cmd.name !== "help")
      .map((cmd) => `${cmd.description} - <b>/${cmd.name}</b>`)
      .join("\n");
    return text(`Available commands:\n\n${commands}`);
  }

  @command({
    name: "add",
    description: "➕ Add a user to the channel",
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
    description: "➖ Remove a user from the channel",
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

  @command({ name: "rating", description: "🏆 Show rating leaderboard" })
  static rating() {
    return paginatedText({
      name: "rating",
      header: "Rating  🏆",
      fetchPage: (page, ctx) => Service.channels.getUsers(ctx.chatId, page),
      formatItem: (item, i) => `${i + 1}. <b>${item.user.username}</b> ${item.user.solved}`,
      buttons: new InlineKeyboard().text("🔥 Cumulative rating", "command:rating_cml"),
    });
  }

  @command({ name: "rating_cml", description: "🔥 Show cumulative rating" })
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
      buttons: new InlineKeyboard().text("🏆 Regular rating", "command:rating"),
    });
  }

  @command({ name: "profile", description: "👤 View user profiles" })
  static profile() {
    return paginatedButtons({
      name: "profile",
      fetchPage: (page, ctx) => Service.channels.getUsers(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `profile:${item.user.id}`,
      }),
      buttonsPerRow: 2,
    });
  }

  @command({ name: "avatar", description: "🖼️ View user avatars" })
  static avatar() {
    return paginatedButtons({
      name: "avatar",
      fetchPage: (page, ctx) => Service.channels.getUsers(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `avatar:${item.user.id}`,
      }),
      buttonsPerRow: 2,
    });
  }

  @command({ name: "langstats", description: "📊 View language statistics" })
  static langstats() {
    return paginatedButtons({
      name: "langstats",
      fetchPage: (page, ctx) => Service.channels.getUsers(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `langstats:${item.user.id}`,
      }),
      buttonsPerRow: 2,
    });
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

  for (const cmd of COMMANDS_TO_REGISTER) {
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
}
