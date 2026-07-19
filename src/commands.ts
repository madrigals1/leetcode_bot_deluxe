import { Bot } from "grammy";
import { command, commandsRegisteredByDecorator } from "./decorators";

export default class Commands {
  @command({ name: "start" })
  static start(): string {
    return "Welcome! I am the LeetCode Bot Deluxe.";
  }

  @command({ name: "help" })
  static help(): string {
    return "Available commands: /start, /help";
  }
}

export function registerCommands(bot: Bot) {
  for (const cmd of commandsRegisteredByDecorator) {
    bot.command(cmd.name, async (ctx) => {
      const result = await cmd.handler(ctx);
      if (result) {
        await ctx.reply(result);
      }
    });
  }
}
