import { Context } from "grammy";

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
