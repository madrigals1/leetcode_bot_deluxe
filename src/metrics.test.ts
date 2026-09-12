import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { register } from "prom-client";

const mocks = vi.hoisted(() => ({
  createServer: vi.fn(),
}));

vi.mock("http", () => ({
  createServer: mocks.createServer,
}));

import {
  apiErrorsTotal,
  apiRequestsTotal,
  callbacksTotal,
  commandDurationSeconds,
  commandsErrorsTotal,
  commandsTotal,
  paginationErrorsTotal,
  startMetricsServer,
  uncaughtErrorsTotal,
} from "./metrics";

interface FakeRes {
  writeHead: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
}

function makeFakeRes(): FakeRes {
  return {
    writeHead: vi.fn(),
    end: vi.fn(),
    setHeader: vi.fn(),
  };
}

let requestHandler: (req: { url?: string }, res: FakeRes) => void | Promise<void>;
let listenMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  requestHandler = () => {};
  listenMock = vi.fn((_port: unknown, cb?: () => void) => {
    cb?.();
  });
  mocks.createServer.mockReset();
  mocks.createServer.mockImplementation(
    (handler: (req: { url?: string }, res: FakeRes) => void | Promise<void>) => {
      requestHandler = handler;
      return { listen: listenMock };
    },
  );
});

afterEach(() => {
  mocks.createServer.mockReset();
  vi.restoreAllMocks();
});

describe("metrics server", () => {
  it("listens on the configured port", () => {
    startMetricsServer();
    expect(mocks.createServer).toHaveBeenCalledTimes(1);
    expect(listenMock).toHaveBeenCalledWith(19099, expect.any(Function));
  });

  it("serves the collected metrics at /metrics", async () => {
    apiRequestsTotal.inc({ service: "backend", method: "GET", path: "/x", status: "200" });
    apiErrorsTotal.inc({ service: "backend", kind: "network" });
    commandsTotal.inc({ command: "start" });
    commandsErrorsTotal.inc({ command: "start", error: "boom" });
    commandDurationSeconds.observe({ command: "start" }, 0.01);
    callbacksTotal.inc({ action: "cmd:start" });
    uncaughtErrorsTotal.inc({ error: "boom" });
    paginationErrorsTotal.inc({ name: "rating" });

    startMetricsServer();
    const res = makeFakeRes();
    await requestHandler({ url: "/metrics" }, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      register.contentType,
    );
    expect(res.writeHead).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledTimes(1);

    const text = String(res.end.mock.calls[0][0]);
    expect(text).toContain("leetcode_bot_api_requests_total");
    expect(text).toContain("leetcode_bot_commands_total{command=\"start\"} 1");
    expect(text).toContain("leetcode_bot_command_duration_seconds");
    expect(text).toContain("leetcode_bot_callbacks_total{action=\"cmd:start\"} 1");
    expect(text).toContain("leetcode_bot_uncaught_errors_total{error=\"boom\"} 1");
    expect(text).toContain("leetcode_bot_pagination_errors_total{name=\"rating\"} 1");
  });

  it("returns 404 for other paths", async () => {
    startMetricsServer();
    const res = makeFakeRes();
    await requestHandler({ url: "/health" }, res);
    expect(res.writeHead).toHaveBeenCalledWith(404);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when metric collection fails", async () => {
    const metricsSpy = vi.spyOn(register, "metrics")
      .mockRejectedValueOnce(new Error("collection failed"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    startMetricsServer();
    const res = makeFakeRes();
    await requestHandler({ url: "/metrics" }, res);

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to collect metrics:",
      expect.any(Error),
    );
    expect(res.writeHead).toHaveBeenCalledWith(500);
    expect(res.end).toHaveBeenCalledWith("Internal error");

    metricsSpy.mockRestore();
    errorSpy.mockRestore();
  });
});