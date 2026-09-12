import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("dotenv/config", () => ({}));

const REQUIRED = {
  TELEGRAM_BOT_TOKEN: "test-token",
  BACKEND_JWT_REFRESH_TOKEN: "test-refresh-token",
  BACKEND_URL: "http://backend.test",
  VIZAPI_URL: "http://vizapi.test",
};

async function loadConstants(): Promise<typeof import("./constants")> {
  return import("./constants");
}

describe("constants", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("loads defaults from the environment", async () => {
    vi.stubEnv("SUPER_ADMIN_TELEGRAM_USERNAMES", "");
    const c = await loadConstants();
    expect(c.TELEGRAM_BOT_TOKEN).toBe(REQUIRED.TELEGRAM_BOT_TOKEN);
    expect(c.BACKEND_URL).toBe(REQUIRED.BACKEND_URL);
    expect(c.VIZAPI_URL).toBe(REQUIRED.VIZAPI_URL);
    expect(c.BACKEND_JWT_REFRESH_TOKEN).toBe(REQUIRED.BACKEND_JWT_REFRESH_TOKEN);
    expect(c.TOKEN_MAX_AGE_MS).toBe(20 * 60 * 60 * 1000);
    expect(c.METRICS_PORT).toBe(19099);
    expect(c.SUPER_ADMIN_TELEGRAM_USERNAMES).toEqual([]);
    expect(c.CML_EASY_POINTS).toBe("0.5");
    expect(c.CML_MEDIUM_POINTS).toBe("1.5");
    expect(c.CML_HARD_POINTS).toBe("5");
  });

  it("parses superadmins, token age and metrics port from the environment", async () => {
    vi.stubEnv("SUPER_ADMIN_TELEGRAM_USERNAMES", " alice ,bob,  ");
    vi.stubEnv("TOKEN_MAX_AGE_HOURS", "2");
    vi.stubEnv("METRICS_PORT", "8080");
    vi.stubEnv("CML_EASY_POINTS", "1");
    vi.stubEnv("CML_MEDIUM_POINTS", "3");
    vi.stubEnv("CML_HARD_POINTS", "10");
    const c = await loadConstants();
    expect(c.SUPER_ADMIN_TELEGRAM_USERNAMES).toEqual(["alice", "bob"]);
    expect(c.TOKEN_MAX_AGE_MS).toBe(2 * 60 * 60 * 1000);
    expect(c.METRICS_PORT).toBe(8080);
    expect(c.CML_EASY_POINTS).toBe("1");
    expect(c.CML_MEDIUM_POINTS).toBe("3");
    expect(c.CML_HARD_POINTS).toBe("10");
  });

  it("uses fallback defaults when optional variables are absent", async () => {
    delete process.env.TOKEN_MAX_AGE_HOURS;
    delete process.env.CML_EASY_POINTS;

    const c = await loadConstants();
    expect(c.TOKEN_MAX_AGE_MS).toBe(20 * 60 * 60 * 1000);
    expect(c.CML_EASY_POINTS).toBe("0.5");
  });

  it.each(["TELEGRAM_BOT_TOKEN", "BACKEND_JWT_REFRESH_TOKEN", "BACKEND_URL", "VIZAPI_URL"])(
    "exits when a required variable is missing: %s",
    async (key) => {
      vi.stubEnv(key, "");
      const exitSpy = vi.spyOn(process, "exit")
        .mockImplementation(((code?: string | number) => {
          throw new Error(`exit called with ${code}`);
        }) as never);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(import("./constants")).rejects.toThrow("exit called with 1");
      expect(errorSpy).toHaveBeenCalledWith(`Error: ${key} is not set.`);

      exitSpy.mockRestore();
      errorSpy.mockRestore();
    },
  );
});