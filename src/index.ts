import { Bot } from "grammy";
import { TELEGRAM_BOT_TOKEN } from "./constants";
import { registerCommands } from "./command";
import { registerCallbacks } from "./callback/callbacks";

const bot = new Bot(TELEGRAM_BOT_TOKEN!);

registerCommands(bot);
registerCallbacks(bot);

bot.start({
  onStart: (botInfo) =>
    console.log(`Bot @${botInfo.username} is running.`),
});
