import { InlineKeyboard } from "grammy";
import {
  command,
} from "@/command/decorator";
import type { ParsedArgs } from "@/command/types";
import { CommandRegistry } from "@/command/registry";
import { UsersService, ChannelsService, ChannelUsersService } from "@/services/backend";
import { VizApiService } from "@/services/vizapi";
import type { PieData } from "@/services/vizapi";
import { LbContext } from "@/utils/context";
import {
  CML_EASY_POINTS,
  CML_MEDIUM_POINTS,
  CML_HARD_POINTS,
  SUPER_ADMIN_TELEGRAM_USERNAMES,
} from "@/constants";
import {
  text,
  errorText,
  successText,
  photo,
  buttons,
  editText,
  paginatedText,
  paginatedButtons,
} from "@/command/response/shortcuts";
import { getDifficultyCount } from "@/utils/leetcode";
import { boldUsername } from "@/utils/format";
import { DataNotFoundError } from "@/errors";
import { buildCompareData } from "./utils";
import { timeAgo } from "short-time-ago";

export default class Commands {
  @command({ name: "start", description: "🚀 Start the bot" })
  static start() {
    return text("Welcome to the LeetCode BOT.\n\nUse <b>/commands</b> to see available commands.");
  }

  @command({ name: "commands", description: "❓ Show this help message" })
  static commands() {
    const commands = CommandRegistry.getAll()
      .filter((cmd) => !cmd.requiresSuperAdmin)
      .map((cmd) => `${cmd.description} - <b>/${cmd.name}</b>`)
      .join("\n");
    return text(`Available commands:\n\n${commands}`);
  }

  @command({
    name: "botfather",
    description: "🤖 Show commands in BotFather format",
    requiresSuperAdmin: true,
  })
  static botfather() {
    const commands = CommandRegistry.getAll()
      .filter((cmd) => !cmd.requiresSuperAdmin)
      .map((cmd) => `${cmd.name} - ${cmd.description}`)
      .join("\n");

    const keyboard = new InlineKeyboard()
      .text("🛡️ Superadmin", "command:superadmin");

    return buttons({ text: commands, buttons: keyboard });
  }

  @command({
    name: "superadmin",
    description: "🛡️ Show superadmin info",
    requiresSuperAdmin: true,
  })
  static async superadmin(ctx: LbContext) {
    const { count } = await ChannelsService.getUsersSimplified(ctx.chatId);
    const superAdmins = SUPER_ADMIN_TELEGRAM_USERNAMES.map(
      (username) => `- <b>${username}</b>`,
    ).join("\n");

    const keyboard = new InlineKeyboard()
      .text("🤖 BotFather", "command:botfather");

    return buttons({
      text:
        `🛡️ <b>Superadmins:</b>\n${superAdmins}\n\n` +
        `💬 Channel ID: <code>${ctx.chatId}</code>\n` +
        `👥 Users in channel: <b>${count}</b>`,
      buttons: keyboard,
    });
  }

  @command({
    name: "add",
    description: "➕ Add a user to the channel",
    args: [{ name: "username" }],
  })
  static async add(ctx: LbContext, parsedArgs: ParsedArgs) {
    await UsersService.addToChannel(parsedArgs.username, ctx.chatId);
    return successText(`User ${boldUsername(parsedArgs.username)} was successfully added.`);
  }

  @command({
    name: "remove",
    description: "➖ Remove a user from the channel",
    args: [{ name: "username", optional: true }],
    requiresAdmin: true,
  })
  static async remove(ctx: LbContext, parsedArgs: ParsedArgs) {
    if (parsedArgs.username) {
      await UsersService.removeFromChannel(parsedArgs.username, ctx.chatId);
      return successText(`User ${boldUsername(parsedArgs.username)} was successfully removed.`);
    }

    return paginatedButtons({
      name: "remove",
      text: "Select a user to remove:",
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `command:remove ${item.user.username}`,
      }),
      buttonsPerRow: 2,
    });
  }

  @command({
    name: "track",
    description: "🆔 Track a LeetCode username",
    args: [{ name: "leetcode_username" }],
  })
  static async track(ctx: LbContext, parsedArgs: ParsedArgs) {
    await ChannelUsersService.track(
      ctx.chatId,
      ctx.telegramUsername,
      parsedArgs.leetcode_username,
    );
    const username = boldUsername(parsedArgs.leetcode_username);

    return successText(
      `Now tracking ${username} on LeetCode. `
      + `Use <b>/myrank</b> to see ranking for ${username}.`,
    );
  }

  @command({
    name: "refresh",
    description: "🔄 Refresh all users' LeetCode data",
  })
  static async refresh(lbctx: LbContext) {
    const msg = await lbctx.ctx.reply("🔄 Refreshing LeetCode data for all users in this channel...");
    await ChannelsService.refresh(lbctx.chatId);
    return editText({
      text: "✅ LeetCode data has been refreshed for all users in this channel!",
      message_id: msg.message_id,
    });
  }

  @command({ name: "myrank", description: "🏆 Show your channel ranking" })
  static async myrank(ctx: LbContext) {
    const {
      leetcode_username,
      solved,
      solved_cml,
      placement,
      nearest_above,
      solved_to_next,
    } = await ChannelUsersService.rank(ctx.chatId, ctx.telegramUsername);

    if (!placement) {
      return errorText(
        'You are not tracking anyone in this channel.\n\n' +
        `Use <b>/track leetcode_username</b> to track a LeetCode account.`
      );
    }

    const parts = [`Placement: <b>#${placement}</b> 🏆`];

    if (leetcode_username) {
      parts.push(`Username: <b>${leetcode_username}</b>`);
    }

    if (solved !== undefined && solved_cml !== undefined) {
      parts.push(`Solved: <b>${solved}</b> (${solved_cml} cumulative)`);
    }

    if (nearest_above) {
      parts.push(
        `\n⬆️ User ahead: <b>${nearest_above.username}</b> — ` +
        `<b>${nearest_above.solved}</b> solved (${nearest_above.solved_cml} cumulative)`,
      );
    }

    if (solved_to_next !== undefined) {
      parts.push(`\n🎯 Problems needed to advance: <b>${solved_to_next}</b>`);
    }

    parts.push(
      `\n<blockquote>💡 You can change your tracked username with: `
      + '<b>/track username</b>.</blockquote>',
    );

    return text(parts.join("\n"));
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

  @command({
    name: "rating_cml",
    description: "🔥 Show cumulative rating",
  })
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

  @command({
    name: "profile",
    description: "👤 View user profiles",
    args: [{ name: "username", optional: true }],
  })
  static async profile(ctx: LbContext, parsedArgs: ParsedArgs) {
    if (parsedArgs.username) {
      const user = await ChannelUsersService.getUserInChannel(parsedArgs.username, ctx.chatId);
      const name = user.data?.profile?.realName ?? user.username;
      const solved = user.data?.submitStats?.acSubmissionNum ?? [];
      const total = user.data?.submitStats?.totalSubmissionNum ?? [];

      const profileText =
        `<b>${name}</b> - https://leetcode.com/${user.username}\n\n` +
        "Solved Problems:\n" +
        `🟢 Easy - <b>${getDifficultyCount(solved, "Easy")}</b>\n` +
        `🟡 Medium - <b>${getDifficultyCount(solved, "Medium")}</b>\n` +
        `🔴 Hard - <b>${getDifficultyCount(solved, "Hard")}</b>\n` +
        `🔵 All - <b>${getDifficultyCount(solved, "All")} / ${getDifficultyCount(total, "All")}</b>\n` +
        `🔷 Cumulative - <b>${user.solved_cml}</b>\n\n` +
        `🕐 Last refreshed: <b>${timeAgo(new Date(user.updated_at))}</b>`;

      const keyboard = new InlineKeyboard()
        .text("📝 Submissions", `command:submissions ${user.username}`)
        .text("📊 Problems", `command:problems ${user.username}`)
        .text("🖼️ Avatar", `command:avatar ${user.username}`);

      return buttons({ text: profileText, buttons: keyboard });
    }

    return paginatedButtons({
      name: "profile",
      text: "Select a user to view their profile:",
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `command:profile ${item.user.username}`,
      }),
      buttonsPerRow: 2,
    });
  }

  @command({
    name: "avatar",
    description: "🖼️ View user avatars",
    args: [{ name: "username", optional: true }],
  })
  static async avatar(ctx: LbContext, parsedArgs: ParsedArgs) {
    if (parsedArgs.username) {
      const user = await ChannelUsersService.getUserInChannel(parsedArgs.username, ctx.chatId);
      const avatarUrl = user.data?.profile?.userAvatar;

      if (avatarUrl) {
        return photo({ photo: avatarUrl });
      }

      return errorText("No avatar found.");
    }

    return paginatedButtons({
      name: "avatar",
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `command:avatar ${item.user.username}`,
      }),
      buttonsPerRow: 2,
    });
  }

  @command({
    name: "langstats",
    description: "📊 View language statistics",
    args: [{ name: "username", optional: true }],
  })
  static async langstats(ctx: LbContext, parsedArgs: ParsedArgs) {
    if (parsedArgs.username) {
      const user = await ChannelUsersService.getUserInChannel(parsedArgs.username, ctx.chatId);
      const stats = user.data?.languageStats ?? [];

      const langText =
        `👨‍💻 Problems solved by ${boldUsername(user.username)} in:\n\n` +
        stats
          .sort((a, b) => b.problemsSolved - a.problemsSolved)
          .map((s) => `- <b>${s.languageName}</b> ${s.problemsSolved}`)
          .join("\n");

      return text(langText);
    }

    return paginatedButtons({
      name: "langstats",
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `command:langstats ${item.user.username}`,
      }),
      buttonsPerRow: 2,
    });
  }

  @command({
    name: "submissions",
    description: "📝 View recent submissions",
    args: [{ name: "username", optional: true }],
  })
  static async submissions(ctx: LbContext, parsedArgs: ParsedArgs) {
    if (parsedArgs.username) {
      const user = await ChannelUsersService.getUserInChannel(parsedArgs.username, ctx.chatId);
      const submissions = user.data?.computed?.submissions ?? [];

      if (submissions.length === 0) {
        throw new DataNotFoundError();
      }

      const table = submissions.slice(0, 10).map((s) => ({
        Name: s.name,
        Time: s.time,
        Language: s.language,
        Status: s.status,
      }));

      const { link } = await VizApiService.generateTable(table);

      return photo({ photo: link });
    }

    return paginatedButtons({
      name: "submissions",
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `command:submissions ${item.user.username}`,
      }),
      buttonsPerRow: 2,
    });
  }

  @command({
    name: "problems",
    description: "🥧 Show problems solved pie chart",
    args: [{ name: "username", optional: true }],
  })
  static async problems(ctx: LbContext, parsedArgs: ParsedArgs) {
    if (parsedArgs.username) {
      const user = await ChannelUsersService.getUserInChannel(parsedArgs.username, ctx.chatId);
      const stats = user.data?.submitStats?.acSubmissionNum ?? [];

      const getCount = (difficulty: string) =>
        stats.find((s) => s.difficulty === difficulty)?.count ?? 0;

      const pieData: PieData = {
        title: `Problems solved by ${user.username}`,
        sliceName: "Difficulty",
        sliceValue: "Count",
        sliceData: [
          { sliceName: "Easy", sliceValue: getCount("Easy"), sliceColor: "#22c55e" },
          { sliceName: "Medium", sliceValue: getCount("Medium"), sliceColor: "#eab308" },
          { sliceName: "Hard", sliceValue: getCount("Hard"), sliceColor: "#ef4444" },
        ],
        chartArea: {},
        width: 600,
        height: 400,
      };

      const { link } = await VizApiService.generatePie(pieData);
      return photo({ photo: link });
    }

    return paginatedButtons({
      name: "problems",
      fetchPage: (page, ctx) => ChannelsService.getUsersSimplified(ctx.chatId, page),
      itemToButton: (item) => ({
        text: item.user.username,
        callback_data: `command:problems ${item.user.username}`,
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
  static async compare(ctx: LbContext, parsedArgs: ParsedArgs) {
    if (parsedArgs.username1 && parsedArgs.username2) {
      const [user1, user2] = await Promise.all([
        ChannelUsersService.getUserInChannel(parsedArgs.username1, ctx.chatId),
        ChannelUsersService.getUserInChannel(parsedArgs.username2, ctx.chatId),
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
