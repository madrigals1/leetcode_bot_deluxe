import { Context } from "grammy";
import { describe, expect, it, vi } from "vitest";
import { CommandRegistry } from "@/command/registry";
import { makeFakeContext } from "../../../tests/helpers/makeFakeContext";
import { LbContext } from "@/utils/context";
import { dispatchCallbackResponse } from "./dispatch";

function makeLb() {
  const ctx = makeFakeContext() as ReturnType<typeof makeFakeContext> & {
    api: { editMessageText: ReturnType<typeof vi.fn> };
  };
  ctx.api = { editMessageText: vi.fn() };
  return new LbContext(ctx as unknown as Context);
}

function registerDemo(options: {
  args?: Array<{ name: string; optional?: boolean }>;
  requiresSuperAdmin?: boolean;
}) {
  const name = `demo_${Math.random().toString(36).slice(2)}`;
  const originalFn = vi.fn(async () => ({ type: "text", text: "done" }));
  CommandRegistry.addCommand({
    name,
    description: "demo",
    args: options.args,
    requiresSuperAdmin: options.requiresSuperAdmin,
    originalFn,
    handler: originalFn,
  });
  return { name, originalFn };
}

describe("dispatchCallbackResponse", () => {
  it("dispatches an editText response", async () => {
    const lb = makeLb();
    await dispatchCallbackResponse(lb, { type: "editText", text: "edited" });
    const ctx = lb.ctx as unknown as {
      editMessageText: ReturnType<typeof vi.fn>;
    };
    expect(ctx.editMessageText).toHaveBeenCalledWith("edited", {
      reply_markup: undefined,
    });
  });

  it("dispatches an editPhoto response", async () => {
    const lb = makeLb();
    await dispatchCallbackResponse(lb, {
      type: "editPhoto",
      photo: "https://x",
      caption: "cap",
    });
    const ctx = lb.ctx as unknown as {
      editMessageMedia: ReturnType<typeof vi.fn>;
    };
    expect(ctx.editMessageMedia).toHaveBeenCalledWith(
      {
        type: "photo",
        media: "https://x",
        caption: "cap",
      },
      { reply_markup: undefined },
    );
  });

  it("redirects to a registered command with parsed args", async () => {
    const lb = makeLb();
    const { name, originalFn } = registerDemo({ args: [{ name: "username" }] });

    await dispatchCallbackResponse(lb, {
      type: "commandRedirect",
      command: `${name} Alice`,
    });

    expect(originalFn).toHaveBeenCalledWith(lb, { username: "alice" });
    const ctx = lb.ctx as unknown as {
      editMessageText: ReturnType<typeof vi.fn>;
    };
    expect(ctx.editMessageText).toHaveBeenCalledWith("done", {
      reply_markup: undefined,
    });
  });

  it("redirects to a command without args", async () => {
    const lb = makeLb();
    const { name, originalFn } = registerDemo({});

    await dispatchCallbackResponse(lb, {
      type: "commandRedirect",
      command: name,
    });

    expect(originalFn).toHaveBeenCalledWith(lb, {});
  });

  it("does nothing when the command is unknown", async () => {
    const lb = makeLb();
    await expect(
      dispatchCallbackResponse(lb, {
        type: "commandRedirect",
        command: "does_not_exist",
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects when the redirected command requires a superadmin", async () => {
    const lb = makeLb();
    const { name } = registerDemo({ requiresSuperAdmin: true });

    await expect(
      dispatchCallbackResponse(lb, {
        type: "commandRedirect",
        command: name,
      }),
    ).rejects.toThrow("You don't have permission to use this command.");
  });
});