import { Bot, Context } from "grammy";
import { command, getCommands } from "./decorators";

export default class Commands {
  @command({ name: "start" })
  static start(_ctx: Context): string {
    return "Welcome! I am the LeetCode Bot Deluxe.";
  }

  @command({ name: "help" })
  static help(_ctx: Context): string {
    return "Available commands: /start, /help";
  }
}

export function registerCommands(bot: Bot) {
  for (const cmd of getCommands(Commands)) {
    bot.command(cmd.name, async (ctx) => {
      const handler = Commands[cmd.methodName as keyof typeof Commands];
      const result = await (handler as (ctx: Context) => Promise<string> | string)(ctx);
      if (result) await ctx.reply(result);
    });
  }
}
