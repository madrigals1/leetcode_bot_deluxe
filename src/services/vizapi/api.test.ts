import { afterEach, describe, expect, it, vi } from "vitest";
import { VizApiService } from "@/services/vizapi";
import { VizApiNotAvailableError } from "@/errors";
import { jsonResponse } from "../../../tests/helpers/fetch";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubJson(body: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(200, body)));
}

describe("VizApiService", () => {
  it("checks health", async () => {
    stubJson({ status: "ok", uptime: 3 });
    await expect(VizApiService.health()).resolves.toEqual({
      status: "ok",
      uptime: 3,
    });
  });

  it("generates a table", async () => {
    let requestBody: unknown;
    vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
      requestBody = JSON.parse(String(init?.body));
      return jsonResponse(200, { link: "https://img/table" });
    }));

    await VizApiService.generateTable([{ Name: "Two Sum" }]);
    expect(requestBody).toEqual({ table: [{ Name: "Two Sum" }] });
  });

  it("generates a compare chart", async () => {
    let requestBody: unknown;
    vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
      requestBody = JSON.parse(String(init?.body));
      return jsonResponse(200, { link: "https://img/compare" });
    }));

    const data = {
      left: {
        image: "https://a",
        bio_fields: [{ name: "Rank", value: 1 }],
        compare_fields: [{ name: "Solved", value: 5, bigger: true }],
      },
      right: {
        image: "https://b",
        bio_fields: [],
        compare_fields: [{ name: "Solved", value: 3 }],
      },
    };
    const res = await VizApiService.generateCompare(data);
    expect(res.link).toBe("https://img/compare");
    expect(requestBody).toEqual(data);
  });

  it("generates a pie chart", async () => {
    let requestBody: unknown;
    vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
      requestBody = JSON.parse(String(init?.body));
      return jsonResponse(200, { link: "https://img/pie" });
    }));

    const pieData = {
      title: "Problems by alice",
      sliceName: "Difficulty",
      sliceValue: "Count",
      sliceData: [],
      chartArea: {},
      width: 600,
      height: 400,
    };
    await VizApiService.generatePie(pieData);
    expect(requestBody).toEqual(pieData);
  });

  it("maps HTTP errors to a friendly message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(500, {})));
    await expect(VizApiService.health()).rejects.toThrow("VizAPI error: 500");
  });

  it("maps network errors to VizApiNotAvailableError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));
    await expect(VizApiService.health()).rejects.toBeInstanceOf(
      VizApiNotAvailableError,
    );
  });
});