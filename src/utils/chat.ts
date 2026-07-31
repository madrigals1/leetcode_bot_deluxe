import { Context } from "grammy";
import { SUPER_ADMIN_TELEGRAM_USERNAMES } from "@/constants";

export function isSuperAdmin(ctx: Context): boolean {
  const username = ctx.from?.username;
  return username ? SUPER_ADMIN_TELEGRAM_USERNAMES.includes(username) : false;
}

export async function isOwnerOrPrivate(ctx: Context): Promise<boolean> {
  if (!ctx.chat || !ctx.from) {
    return false;
  }

  if (ctx.chat.type === "private") {
    return true;
  }

  const member = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
  return member.status === "creator" || member.status === "administrator";
}
