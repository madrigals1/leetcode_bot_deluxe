import { Bot } from "grammy";
import { TELEGRAM_BOT_TOKEN } from "./constants";
import { registerCommands } from "./commands";

const bot = new Bot(TELEGRAM_BOT_TOKEN!);

registerCommands(bot);

bot.start({
  onStart: (botInfo) =>
    console.log(`Bot @${botInfo.username} is running.`),
});
