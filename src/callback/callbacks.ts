import { Bot } from "grammy";
import { callback } from "@/callback";
import { CALLBACKS_TO_REGISTER } from "@/callback/registry";
import { Service } from "@/services";
import { LbContext } from "@/utils/context";
import { getDifficultyCount } from "@/utils/leetcode";
import { editText, editPhoto, commandRedirect } from "@/callback/response/shortcuts";

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

    return editText(text);
  }

  @callback({ action: /^avatar:(\d+)$/ })
  static async onAvatarUser(lbctx: LbContext) {
    const userId = Number(lbctx.match[1]);
    const user = await Service.users.getById(userId);
    const avatarUrl = user.data?.profile?.userAvatar;

    if (avatarUrl) {
      return editPhoto({ photo: avatarUrl });
    }

    return editText("No avatar found.");
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

    return editText(text);
  }

  @callback({ action: /^command:(.+)$/ })
  static onCommandRedirect(lbctx: LbContext) {
    return commandRedirect(lbctx.match[1]);
  }
}

export function registerCallbacks(bot: Bot) {
  for (const cb of CALLBACKS_TO_REGISTER) {
    bot.callbackQuery(cb.action, async (ctx) => {
      await cb.handler(ctx);
    });
  }
}
