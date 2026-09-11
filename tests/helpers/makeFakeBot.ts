import type { Bot, Context } from "grammy";
import { vi } from "vitest";

type CommandHandler = (ctx: Context) => unknown;
type CallbackHandler = (ctx: Context) => unknown;

function callbackKey(action: string | RegExp): string {
  return action instanceof RegExp ? action.source : action;
}

export function makeFakeBot() {
  const registeredCommands = new Map<string, CommandHandler>();
  const registeredCallbacks = new Map<string, CallbackHandler>();

  const command = vi.fn(
    (name: string, handler: CommandHandler): void => {
      registeredCommands.set(name, handler);
    },
  );

  const callbackQuery = vi.fn(
    (action: string | RegExp, handler: CallbackHandler): void => {
      registeredCallbacks.set(callbackKey(action), handler);
    },
  );

  const editMessageText = vi.fn();

  return {
    bot: {
      command,
      callbackQuery,
      api: { editMessageText },
    } as unknown as Bot,
    registeredCommands,
    registeredCallbacks,
    command,
    callbackQuery,
    editMessageText,
  };
}