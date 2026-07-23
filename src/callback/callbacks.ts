import {
  callback,
} from "@/callback";
import { commandsRegisteredByDecorator } from "@/command/decorator";
import { Service } from "@/services";
import { LbContext } from "@/types/context";
import { getDifficultyCount } from "@/utils/leetcode";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}

export class Callbacks {
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
