import { describe, expect, it } from "vitest";
import {
  boldUsername,
  escapeHtml,
  formatUptime,
  humanizeTimestamp,
  stripEmojis,
} from "./format";

describe("humanizeTimestamp", () => {
  it("returns a dash for null and empty values", () => {
    expect(humanizeTimestamp(null)).toBe("-");
    expect(humanizeTimestamp("")).toBe("-");
  });

  it("returns a dash instead of NaN text for invalid dates", () => {
    expect(humanizeTimestamp("not-a-date")).toBe("-");
    expect(humanizeTimestamp("2024-13-99")).toBe("-");
  });

  it("formats a valid timestamp", () => {
    const result = humanizeTimestamp(new Date().toISOString());
    expect(result).toBeTruthy();
    expect(result).not.toContain("NaN");
  });
});

describe("formatUptime", () => {
  it("formats sub-minute uptime as seconds only", () => {
    expect(formatUptime(0)).toBe("0s");
    expect(formatUptime(59)).toBe("59s");
  });

  it("rolls over into minutes", () => {
    expect(formatUptime(60)).toBe("1m 0s");
    expect(formatUptime(61)).toBe("1m 1s");
  });

  it("rolls over into hours", () => {
    expect(formatUptime(3600)).toBe("1h 0m 0s");
    expect(formatUptime(3661)).toBe("1h 1m 1s");
  });

  it("rolls over into days", () => {
    expect(formatUptime(90061)).toBe("1d 1h 1m 1s");
  });
});

describe("stripEmojis", () => {
  it("removes pictographic emojis", () => {
    expect(stripEmojis("🎉 hello world")).toBe("hello world");
  });

  it("keeps plain text unchanged", () => {
    expect(stripEmojis("hello world")).toBe("hello world");
  });
});

describe("escapeHtml", () => {
  it("escapes HTML-special characters", () => {
    expect(escapeHtml('<script>"hello"</script>')).toBe(
      "&lt;script&gt;&quot;hello&quot;&lt;/script&gt;",
    );
  });

  it("escapes ampersands before other entities", () => {
    expect(escapeHtml("a&b")).toBe("a&amp;b");
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("alice")).toBe("alice");
  });
});

describe("boldUsername", () => {
  it("wraps the username in bold HTML", () => {
    expect(boldUsername("alice")).toBe('<b>"alice"</b>');
  });

  it("escapes HTML characters inside the username", () => {
    expect(boldUsername('<b>"x"')).toBe('<b>"&lt;b&gt;&quot;x&quot;"</b>');
  });
});