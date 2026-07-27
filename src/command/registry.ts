import { Bot, Context } from "grammy";
import { LeetCodeBotError } from "@/errors";
import { RequireBot } from "@/utils/decorators";
import type { CommandMetadata } from "./types";

export class CommandRegistry {
  private static bot?: Bot;
  private static commands: CommandMetadata[] = [];

  static setBot(bot: Bot) {
    CommandRegistry.bot = bot;
  }

  static addCommand(metadata: CommandMetadata) {
    CommandRegistry.commands.push(metadata);
  }

  @RequireBot
  static registerCommand(metadata: CommandMetadata) {
    CommandRegistry.commands.push(metadata);
    CommandRegistry.registerWithBot(metadata);
  }

  @RequireBot
  static registerAllCommands() {
    for (const cmd of CommandRegistry.commands) {
      CommandRegistry.registerWithBot(cmd);
    }
  }

  static findByName(name: string) {
    return CommandRegistry.commands.find((c) => c.name === name);
  }

  static getAll() {
    return CommandRegistry.commands;
  }

  private static registerWithBot(metadata: CommandMetadata) {
    CommandRegistry.bot!.command(metadata.name, async (ctx: Context) => {
      try {
        await metadata.handler(ctx);
      } catch (error) {
        if (error instanceof LeetCodeBotError) {
          await ctx.reply(error.message);
          return;
        }

        await ctx.reply("An error occurred.");
      }
    });
  }
}
