import { describe, expect, it } from "vitest";
import { getDifficultyCount } from "./leetcode";

describe("getDifficultyCount", () => {
  it("returns the count for a matching difficulty", () => {
    const arr = [{ difficulty: "Easy", count: 3 }];
    expect(getDifficultyCount(arr, "Easy")).toBe(3);
  });

  it("returns 0 when the difficulty is absent", () => {
    expect(getDifficultyCount([{ difficulty: "Easy", count: 3 }], "Hard"))
      .toBe(0);
  });

  it("returns 0 for an empty array", () => {
    expect(getDifficultyCount([], "Easy")).toBe(0);
  });
});