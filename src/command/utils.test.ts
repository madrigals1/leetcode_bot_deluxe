import { describe, expect, it } from "vitest";
import { LeetCodeBotError, InvalidArgumentAmountError } from "@/errors";
import { alice, bob } from "../../tests/fixtures/users";
import { buildCompareData, buildExample, parseArgs } from "./utils";

describe("parseArgs", () => {
  const singleRequired = [{ name: "username" }];

  it("lowercases arguments", () => {
    expect(parseArgs("/track Alice", singleRequired)).toEqual({
      username: "alice",
    });
  });

  it("collapses multiple spaces", () => {
    expect(parseArgs("/track   alice   ", singleRequired)).toEqual({
      username: "alice",
    });
  });

  it("defaults missing optionals to empty strings", () => {
    expect(
      parseArgs("/compare", [
        { name: "username1", optional: true },
        { name: "username2", optional: true },
      ]),
    ).toEqual({ username1: "", username2: "" });
  });

  it("throws when too few arguments are given", () => {
    expect(() => parseArgs("/track", singleRequired))
      .toThrowError(InvalidArgumentAmountError);
  });

  it("throws when too many arguments are given", () => {
    expect(() => parseArgs("/track one two three", singleRequired))
      .toThrowError(InvalidArgumentAmountError);
  });

  it("appends the example to the error message", () => {
    const example = "\n\nExample:\n<b>/track username</b> - Track a user";
    expect(() => parseArgs("/track", singleRequired, example))
      .toThrowError(expect.objectContaining({ message: expect.stringContaining(example) }));
  });

  it("raises a LeetCodeBotError", () => {
    try {
      parseArgs("/track", singleRequired);
    } catch (error) {
      expect(error).toBeInstanceOf(LeetCodeBotError);
    }
  });
});

describe("buildExample", () => {
  it("renders arguments and strips emojis from the description", () => {
    const example = buildExample({
      name: "track",
      description: "✨ Track a LeetCode user",
      args: [{ name: "username" }],
    });
    expect(example).toBe(
      "\n\nExample:\n<b>/track username</b> - Track a LeetCode user",
    );
  });

  it("renders argument-less commands", () => {
    const example = buildExample({
      name: "start",
      description: "👋 Start",
    });
    expect(example).toBe("\n\nExample:\n<b>/start</b> - Start");
  });
});

describe("buildCompareData", () => {
  it("fills both sides from the users' stats", () => {
    const data = buildCompareData(alice, bob);

    expect(data.left.image).toBe("https://avatar.example/alice.png");
    expect(data.left.bio_fields).toEqual([
      { name: "Name", value: "Alice A" },
      { name: "Username", value: "alice" },
    ]);
    expect(data.left.compare_fields).toEqual([
      { name: "Problems Solved", value: 120 },
      { name: "Cumulative Score", value: 320.5 },
      { name: "Easy", value: 60 },
      { name: "Medium", value: 45 },
      { name: "Hard", value: 15 },
    ]);
  });

  it("defaults missing data to zero/empty/username", () => {
    const data = buildCompareData(bob, alice);

    expect(data.left.image).toBe("");
    expect(data.left.bio_fields[0]).toEqual({ name: "Name", value: "bob" });
    expect(data.left.compare_fields).toEqual([
      { name: "Problems Solved", value: 0 },
      { name: "Cumulative Score", value: 0 },
      { name: "Easy", value: 0 },
      { name: "Medium", value: 0 },
      { name: "Hard", value: 0 },
    ]);
  });
});