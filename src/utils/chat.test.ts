import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "grammy";
import { makeFakeContext } from "../../tests/helpers/makeFakeContext";

const SUPER_ADMIN = "bot_admin";

function loadChat(): Promise<typeof import("./chat")> {
  return import("./chat");
}

function groupCtx(memberStatus: string): Context {
  const ctx = makeFakeContext() as ReturnType<typeof makeFakeContext> & {
    chat: { id: number; type: string };
    api: { getChatMember: ReturnType<typeof vi.fn> };
  };
  ctx.chat = { id: 1, type: "group" };
  ctx.api = { getChatMember: vi.fn(async () => ({ status: memberStatus })) };
  return ctx as unknown as Context;
}

describe("chat auth helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("SUPER_ADMIN_TELEGRAM_USERNAMES", SUPER_ADMIN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isSuperAdmin", () => {
    it("returns true for a listed superadmin", async () => {
      const { isSuperAdmin } = await loadChat();
      expect(isSuperAdmin(makeFakeContext({ telegramUsername: SUPER_ADMIN })))
        .toBe(true);
    });

    it("matches usernames case-insensitively", async () => {
      const { isSuperAdmin } = await loadChat();
      expect(
        isSuperAdmin(makeFakeContext({ telegramUsername: "BOT_ADMIN" })),
      ).toBe(true);
      expect(
        isSuperAdmin(makeFakeContext({ telegramUsername: "bot_admin" })),
      ).toBe(true);
    });

    it("does not match against another username with a case difference", async () => {
      const { isSuperAdmin } = await loadChat();
      expect(
        isSuperAdmin(makeFakeContext({ telegramUsername: "Bot_AdminX" })),
      ).toBe(false);
    });

    it("returns false for a regular username", async () => {
      const { isSuperAdmin } = await loadChat();
      expect(isSuperAdmin(makeFakeContext())).toBe(false);
    });

    it("returns false when the sender has no username", async () => {
      const { isSuperAdmin } = await loadChat();
      const ctx = makeFakeContext({ telegramUsername: "" }) as unknown as Context;
      expect(isSuperAdmin(ctx)).toBe(false);
    });

    it("returns false when the sender is missing", async () => {
      const { isSuperAdmin } = await loadChat();
      const ctx = makeFakeContext() as unknown as Context;
      delete (ctx as { from?: unknown }).from;
      expect(isSuperAdmin(ctx)).toBe(false);
    });
  });

  describe("isOwnerOrPrivate", () => {
    it("returns false without a chat", async () => {
      const { isOwnerOrPrivate } = await loadChat();
      const ctx = makeFakeContext() as unknown as Context;
      delete (ctx as { chat?: unknown }).chat;
      expect(await isOwnerOrPrivate(ctx)).toBe(false);
    });

    it("returns false without a sender", async () => {
      const { isOwnerOrPrivate } = await loadChat();
      const ctx = makeFakeContext() as unknown as Context;
      (ctx as { chat: { id: number; type: string } }).chat = {
        id: 1,
        type: "group",
      };
      delete (ctx as { from?: unknown }).from;
      expect(await isOwnerOrPrivate(ctx)).toBe(false);
    });

    it("returns true in a private chat", async () => {
      const { isOwnerOrPrivate } = await loadChat();
      const ctx = makeFakeContext() as unknown as Context & {
        chat: { id: number; type: string };
      };
      ctx.chat = { id: 1, type: "private" };
      expect(await isOwnerOrPrivate(ctx)).toBe(true);
    });

    it("returns true for a creator", async () => {
      const { isOwnerOrPrivate } = await loadChat();
      expect(await isOwnerOrPrivate(groupCtx("creator"))).toBe(true);
    });

    it("returns true for an administrator", async () => {
      const { isOwnerOrPrivate } = await loadChat();
      expect(await isOwnerOrPrivate(groupCtx("administrator"))).toBe(true);
    });

    it("returns false for a plain member", async () => {
      const { isOwnerOrPrivate } = await loadChat();
      expect(await isOwnerOrPrivate(groupCtx("member"))).toBe(false);
    });
  });

  describe("assertAuth", () => {
    it("passes without restrictions", async () => {
      const { assertAuth } = await loadChat();
      await expect(assertAuth(makeFakeContext(), {})).resolves.toBeUndefined();
    });

    it("rejects a non-superadmin for a superadmin command", async () => {
      const { assertAuth } = await loadChat();
      await expect(
        assertAuth(makeFakeContext(), { requiresSuperAdmin: true }),
      ).rejects.toThrow("You don't have permission to use this command.");
    });

    it("passes a superadmin for a superadmin command", async () => {
      const { assertAuth } = await loadChat();
      await expect(
        assertAuth(makeFakeContext({ telegramUsername: SUPER_ADMIN }), {
          requiresSuperAdmin: true,
        }),
      ).resolves.toBeUndefined();
    });

    it("rejects a non-superadmin non-owner for an admin command", async () => {
      const { assertAuth } = await loadChat();
      await expect(assertAuth(groupCtx("member"), { requiresAdmin: true }))
        .rejects.toThrow("You don't have permission to use this command.");
    });

    it("passes a superadmin for an admin command", async () => {
      const { assertAuth } = await loadChat();
      await expect(
        assertAuth(makeFakeContext({ telegramUsername: SUPER_ADMIN }), {
          requiresAdmin: true,
        }),
      ).resolves.toBeUndefined();
    });

    it("passes an owner for an admin command", async () => {
      const { assertAuth } = await loadChat();
      await expect(assertAuth(groupCtx("creator"), { requiresAdmin: true }))
        .resolves.toBeUndefined();
    });
  });
});