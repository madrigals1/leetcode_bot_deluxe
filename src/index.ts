import { Bot } from "grammy";
import { TELEGRAM_BOT_TOKEN } from "./constants";

const bot = new Bot(TELEGRAM_BOT_TOKEN!);

bot.command("start", (ctx) =>
  ctx.reply("Welcome! I am the LeetCode Bot Deluxe.")
);

bot.on("message", (ctx) =>
  ctx.reply("I only understand /start for now.")
);

bot.start({
  onStart: (botInfo) =>
    console.log(`Bot @${botInfo.username} is running.`),
});
