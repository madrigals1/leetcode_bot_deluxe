import { InvalidArgumentAmountError } from "@/errors";
import type { User } from "@/services/backend";
import type { CompareData } from "@/services/vizapi";
import { getDifficultyCount } from "@/utils/leetcode";
import { stripEmojis } from "@/utils/format";
import type { CommandArg } from "./types";
import type { CommandOptions } from "./types";
import type { ParsedArgs } from "./types";

export function buildExample(options: CommandOptions): string {
  const args = options.args ?? [];
  const placeholders = args.map((arg) => arg.name).join(" ");

  let command = `/${options.name}`;

  if (placeholders) {
    command += ` ${placeholders}`;
  }

  return `\n\nExample:\n<b>${command}</b> - ${stripEmojis(options.description)}`;
}

export function parseArgs(
  text: string,
  defs: CommandArg[],
  example?: string,
): ParsedArgs {
  const parts = text
    .split(/\s+/)
    .slice(1)
    .map((part) => part.toLowerCase());

  const requiredCount = defs.filter((a) => !a.optional).length;

  if (parts.length < requiredCount) {
    throw new InvalidArgumentAmountError(requiredCount, parts.length, example);
  }

  if (parts.length > defs.length) {
    throw new InvalidArgumentAmountError(defs.length, parts.length, example);
  }

  const result: ParsedArgs = {};

  for (let i = 0; i < defs.length; i++) {
    result[defs[i].name] = parts[i] ?? "";
  }

  return result;
}

export function buildCompareData(user1: User, user2: User): CompareData {
  const side = (u: User) => {
    const stats = u.data?.submitStats?.acSubmissionNum ?? [];
    return {
      image: u.data?.profile?.userAvatar ?? "",
      bio_fields: [
        { name: "Name", value: u.data?.profile?.realName ?? u.username },
        { name: "Username", value: u.username },
      ],
      compare_fields: [
        { name: "Problems Solved", value: u.solved },
        { name: "Cumulative Score", value: u.solved_cml },
        { name: "Easy", value: getDifficultyCount(stats, "Easy") },
        { name: "Medium", value: getDifficultyCount(stats, "Medium") },
        { name: "Hard", value: getDifficultyCount(stats, "Hard") },
      ],
    };
  };

  return { left: side(user1), right: side(user2) };
}
