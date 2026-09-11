import type { Context } from "grammy";
import { vi } from "vitest";

export interface FakeContextOptions {
  chatId?: number;
  telegramUsername?: string;
  match?: RegExpMatchArray | null;
}

export function makeFakeContext(options: FakeContextOptions = {}) {
  const { chatId = 123, telegramUsername = "alice", match = null } = options;

  const ctx = {
    chat: { id: chatId },
    from: { username: telegramUsername },
    match,
    reply: vi.fn(),
    replyWithPhoto: vi.fn(),
    editMessageText: vi.fn(),
    editMessageMedia: vi.fn(),
    answerCallbackQuery: vi.fn(),
  };

  return ctx as unknown as Context;
}