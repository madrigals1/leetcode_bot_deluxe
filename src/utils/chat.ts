import { Context } from "grammy";
import { SUPER_ADMIN_TELEGRAM_USERNAMES } from "@/constants";
import { UnauthorizedError } from "@/errors";

export function isSuperAdmin(ctx: Context): boolean {
  const username = ctx.from?.username;

  if (!username) {
    return false;
  }

  return SUPER_ADMIN_TELEGRAM_USERNAMES.some(
    (admin) => admin.toLowerCase() === username.toLowerCase()
  );
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

export async function assertAuth(
  ctx: Context,
  options: { requiresAdmin?: boolean; requiresSuperAdmin?: boolean },
): Promise<void> {
  const superAdmin = isSuperAdmin(ctx);

  if (options.requiresSuperAdmin && !superAdmin) {
    throw new UnauthorizedError();
  }

  if (
    options.requiresAdmin
    && !superAdmin
    && !(await isOwnerOrPrivate(ctx))
  ) {
    throw new UnauthorizedError();
  }
}
