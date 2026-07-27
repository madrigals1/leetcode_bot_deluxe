import { callback } from "@/callback";
import { Service, Submission } from "@/services/backend";
import { LbContext } from "@/utils/context";
import { DataNotFoundError } from "@/errors";
import { getDifficultyCount } from "@/utils/leetcode";
import { editText, editPhoto, commandRedirect } from "@/callback/response/shortcuts";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}

function formatSubmissionItem(s: Submission, idx: number) {
  return `${idx}. <a href="${s.link}">${escapeHtml(s.name)}</a>\n   ${s.status} | ${s.language} | ${s.runtime}`;
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

  @callback({ action: /^submissions:(\d+)$/ })
  static async onSubmissionsUser(lbctx: LbContext) {
    const userId = Number(lbctx.match[1]);
    const user = await Service.users.getById(userId);
    const submissions = user.data?.computed?.submissions ?? [];

    if (submissions.length === 0) {
      throw new DataNotFoundError();
    }

    const items = submissions
      .slice(0, 10)
      .map((s, i) => formatSubmissionItem(s, i + 1))
      .join("\n\n");

    const text =
      `<b>Last submissions for ${escapeHtml(user.username)}</b>\n\n` +
      items;

    return editText(text);
  }
}
