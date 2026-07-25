import { Bot } from "grammy";
import { TELEGRAM_BOT_TOKEN } from "./constants";
import { CommandRegistry } from "./command";
import { CallbackRegistry } from "./callback";
import { PaginationRegistry } from "@/command/response/pagination/registry";

// Side-effect: ensures @callback decorators execute and register handlers
import "./callback/callbacks";

const bot = new Bot(TELEGRAM_BOT_TOKEN!);

// Make the bot respond in HTML only
bot.api.config.use((prev, method, payload) => {
  if (
    typeof payload === "object" &&
    payload !== null &&
    !("parse_mode" in payload)
  ) {
    (payload as Record<string, unknown>).parse_mode = "HTML";
  }
  return prev(method, payload);
});

CommandRegistry.setBot(bot);
CommandRegistry.registerAllCommands();
CallbackRegistry.setBot(bot);
CallbackRegistry.registerAllCallbacks();
PaginationRegistry.setBot(bot);

bot.start({
  onStart: (botInfo) =>
    console.log(`Bot @${botInfo.username} is running.`),
});
