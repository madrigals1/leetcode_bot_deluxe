import { createServer } from "http";
import { collectDefaultMetrics, register } from "prom-client";
import { METRICS_PORT } from "./constants";

collectDefaultMetrics();

export function startMetricsServer(): void {
  const server = createServer(async (req, res) => {
    if (req.url !== "/metrics") {
      res.writeHead(404);
      res.end();
      return;
    }

    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  });

  server.listen(METRICS_PORT, () => {
    console.log(`Metrics server listening on :${METRICS_PORT}`);
  });
}
