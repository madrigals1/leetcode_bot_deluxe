import { Bot } from "grammy";
import { TELEGRAM_BOT_TOKEN } from "./constants";
import { CommandRegistry } from "./command";
import { CallbackRegistry } from "./callback";
import { PaginationRegistry } from "@/command/response/pagination/registry";
import { VizApiService } from "@/services/vizapi";
import { HealthCheckService } from "@/services/backend/health_check_service";
import { startMetricsServer } from "@/metrics";
import { formatUptime } from "@/utils/format";

// Side-effect: ensures @callback decorators execute and register handlers
import "./callback/callbacks";

(async () => {
  const [vizHealth, backendHealth] = await Promise.all([
    VizApiService.health(),
    HealthCheckService.health(),
  ]);
  console.log(`VizAPI health: ${vizHealth.status} (uptime ${formatUptime(vizHealth.uptime)})`);
  console.log(
    `Backend health: ${backendHealth.status} (db ${backendHealth.database}, ` +
      `${backendHealth.service} v${backendHealth.version}, uptime ${formatUptime(backendHealth.uptime)})`,
  );

  startMetricsServer();

  const bot = new Bot(TELEGRAM_BOT_TOKEN);

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

  bot.catch((err) => {
    console.error("Unhandled bot error:", err.error);
    const ctx = err.ctx;
    if (ctx && ctx.callbackQuery) {
      ctx.answerCallbackQuery("An error occurred. Please try again.");
    }
  });

  bot.start({
    onStart: (botInfo) =>
      console.log(`Bot @${botInfo.username} is running.`),
  });
})();
