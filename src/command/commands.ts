import { InlineKeyboard } from "grammy";
import {
  command,
} from "@/command/decorator";
import type { ParsedArgs } from "@/command/types";
import { CommandRegistry } from "@/command/registry";
import { UsersService, ChannelsService } from "@/services/backend";
import { VizApiService } from "@/services/vizapi";
import { LbContext } from "@/utils/context";
import {
  CML_EASY_POINTS,
  CML_MEDIUM_POINTS,
  CML_HARD_POINTS,
} from "@/constants";
import {
  text,
  photo,
  paginatedText,
  paginatedButtons,
} from "@/command/response/shortcuts";
import { buildCompareData } from "./utils";

export default class Commands {
  @command({ name: "start", description: "🚀 Start the bot" })
  static start() {
    return text("Welcome to the LeetCode BOT.\n\nUse /commands to see available commands.");
  }

  @command({ name: "commands", description: "❓ Show this help message" })
  static commands() {
    const commands = CommandRegistry.getAll()
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
      await UsersService.addToChannel(parsedArgs.username, ctx.chatId);
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
      await UsersService.removeFromChannel(parsedArgs.username, ctx.chatId);
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
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
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
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page, "-user__solved_cml"),
      formatItem: (item, i) => `${i + 1}. <b>${item.user.username}</b> ${item.user.solved_cml}`,
      buttons: new InlineKeyboard().text("🏆 Regular rating", "command:rating"),
    });
  }

  @command({ name: "profile", description: "👤 View user profiles" })
  static profile() {
    return paginatedButtons({
      name: "profile",
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
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
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
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
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `langstats:${item.user.id}`,
      }),
      buttonsPerRow: 2,
    });
  }

  @command({ name: "submissions", description: "📝 View recent submissions" })
  static submissions() {
    return paginatedButtons({
      name: "submissions",
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `submissions:${item.user.id}`,
      }),
      buttonsPerRow: 2,
    });
  }

  @command({
    name: "compare",
    description: "🤝 Compare two users",
    args: [
      { name: "username1", optional: true },
      { name: "username2", optional: true },
    ],
  })
  static async compare(_ctx: LbContext, parsedArgs: ParsedArgs) {
    if (parsedArgs.username1 && parsedArgs.username2) {
      const [user1, user2] = await Promise.all([
        UsersService.getByUsername(parsedArgs.username1),
        UsersService.getByUsername(parsedArgs.username2),
      ]);
      const data = buildCompareData(user1, user2);
      const { link } = await VizApiService.generateCompare(data);
      return photo({ photo: link });
    }

    if (parsedArgs.username1) {
      return paginatedButtons({
        name: "compare",
        text: `Select second user to compare with ${parsedArgs.username1}:`,
        fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
        itemToButton: (item) => ({
          text: item.user.username,
          callback_data: `command:compare ${parsedArgs.username1} ${item.user.username}`,
        }),
        buttonsPerRow: 2,
      });
    }

    return paginatedButtons({
      name: "compare",
      text: "Select first user to compare:",
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `command:compare ${item.user.username}`,
      }),
      buttonsPerRow: 2,
    });
  }
}
