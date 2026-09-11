import { describe, expect, it } from "vitest";
import { CommandRegistry } from "@/command/registry";
import { CallbackRegistry } from "@/callback/registry";
import "@/command/commands";
import "@/callback/callbacks";

describe("decorator-driven wiring", () => {
  it("registers every @command at module load", () => {
    const names = CommandRegistry.getAll().map((c) => c.name);
    const expected = [
      "start",
      "commands",
      "botfather",
      "superadmin",
      "chatid",
      "add",
      "remove",
      "track",
      "refresh",
      "myrank",
      "rating",
      "rating_cml",
      "profile",
      "avatar",
      "langstats",
      "submissions",
      "problems",
      "compare",
    ];

    expect(names).toEqual(expected);
  });

  it("registers the command: callback at module load", () => {
    const callbacks = CallbackRegistry.getAll();
    expect(callbacks).toHaveLength(1);
    expect(callbacks[0].action).toStrictEqual(/^command:(.+)$/);
  });
});