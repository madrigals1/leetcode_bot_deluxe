import { createServer } from "http";
import { collectDefaultMetrics, Counter, Histogram, register } from "prom-client";
import { METRICS_PORT } from "./constants";

collectDefaultMetrics();

export const apiRequestsTotal = new Counter({
  name: "leetcode_bot_api_requests_total",
  help: "HTTP requests made to the backend and VizAPI services.",
  labelNames: ["service", "method", "path", "status"],
});

export const apiErrorsTotal = new Counter({
  name: "leetcode_bot_api_errors_total",
  help: "Failed HTTP calls to the backend and VizAPI services.",
  labelNames: ["service", "kind"],
});

export const commandsTotal = new Counter({
  name: "leetcode_bot_commands_total",
  help: "Invoked bot commands.",
  labelNames: ["command"],
});

export const commandsErrorsTotal = new Counter({
  name: "leetcode_bot_commands_errors_total",
  help: "Bot command handler failures.",
  labelNames: ["command", "error"],
});

export const commandDurationSeconds = new Histogram({
  name: "leetcode_bot_command_duration_seconds",
  help: "Bot command handler execution duration.",
  labelNames: ["command"],
});

export const callbacksTotal = new Counter({
  name: "leetcode_bot_callbacks_total",
  help: "Invoked bot inline-button callbacks.",
  labelNames: ["action"],
});

export const uncaughtErrorsTotal = new Counter({
  name: "leetcode_bot_uncaught_errors_total",
  help: "Unhandled bot errors caught by the global error handler.",
  labelNames: ["error"],
});

export const paginationErrorsTotal = new Counter({
  name: "leetcode_bot_pagination_errors_total",
  help: "Failed pagination page loads.",
  labelNames: ["name"],
});

export function startMetricsServer(): void {
  const server = createServer(async (req, res) => {
    if (req.url !== "/metrics") {
      res.writeHead(404);
      res.end();
      return;
    }

    res.setHeader("Content-Type", register.contentType);
    try {
      res.end(await register.metrics());
    } catch (error) {
      console.error("Failed to collect metrics:", error);
      res.writeHead(500);
      res.end("Internal error");
    }
  });

  server.listen(METRICS_PORT, () => {
    console.log(`Metrics server listening on :${METRICS_PORT}`);
  });
}