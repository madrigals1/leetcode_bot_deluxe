import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdminService,
  AuthService,
  ChannelsService,
  ChannelUsersService,
  HealthCheckService,
  UsersService,
} from "@/services/backend";
import {
  BackendUserNotFoundError,
  LeetCodeUserNotFoundError,
  TelegramUserHasNoTrackError,
  UserAlreadyInChannelError,
  UserAlreadyTrackedError,
} from "@/errors";
import { jsonResponse, mockBackendFetch } from "../../../tests/helpers/fetch";
import { alice } from "../../../tests/fixtures/users";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ChannelsService", () => {
  const channelUsersBody = {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };

  it("fetches simplified users without query params", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, channelUsersBody));
    await ChannelsService.getUsersSimplified(5);
    const call = calls.find((c) => c.url.includes("/users/simplified/"));
    expect(call?.url).toBe(
      "http://backend.test/api/v1/channels/5/users/simplified/",
    );
  });

  it("adds the page param", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, channelUsersBody));
    await ChannelsService.getUsersSimplified(5, 3);
    const call = calls.find((c) => c.url.includes("/users/simplified/"));
    expect(call?.url).toContain("page=3");
    expect(call?.url).not.toContain("ordering");
  });

  it("adds page and ordering params", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, channelUsersBody));
    await ChannelsService.getUsersSimplified(5, 2, "-user__solved_cml");
    const call = calls.find((c) => c.url.includes("/users/simplified/"));
    expect(call?.url).toContain("page=2");
    expect(call?.url).toContain("ordering=-user__solved_cml");
  });

  it("runs a channel refresh", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, { detail: "ok" }));
    await ChannelsService.refresh(5);
    const call = calls.find((c) => c.url.endsWith("/api/v1/channels/5/refresh/"));
    expect(call).toBeDefined();
  });
});

describe("UsersService", () => {
  it("adds a user to the channel", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, { message: "added" }));
    const res = await UsersService.addToChannel("alice", 5);
    expect(res).toEqual({ message: "added" });

    const call = calls.find((c) => c.url.endsWith("/api/v1/users/add-to-channel/"));
    expect(call?.init?.method).toBe("POST");
    expect(JSON.parse(String(call?.init?.body))).toEqual({
      username: "alice",
      chat_id: 5,
    });
  });

  it("maps leetcode-not-found when adding", async () => {
    mockBackendFetch(() => jsonResponse(400, { error: "USER_NOT_FOUND_IN_LEETCODE" }));
    await expect(UsersService.addToChannel("ghost", 5))
      .rejects.toBeInstanceOf(LeetCodeUserNotFoundError);
  });

  it("maps a sentinel embedded in a {detail} payload when adding", async () => {
    mockBackendFetch(() =>
      jsonResponse(400, { detail: "Rejected: USER_NOT_FOUND_IN_LEETCODE" })
    );
    await expect(UsersService.addToChannel("ghost", 5))
      .rejects.toBeInstanceOf(LeetCodeUserNotFoundError);
  });

  it("maps already-in-channel when adding", async () => {
    mockBackendFetch(() => jsonResponse(400, { error: "USER_ALREADY_IN_CHANNEL" }));
    await expect(UsersService.addToChannel("alice", 5))
      .rejects.toBeInstanceOf(UserAlreadyInChannelError);
  });

  it("passes through unmatched errors when adding", async () => {
    mockBackendFetch(() => jsonResponse(500, { error: "WHO_KNOWS" }));
    await expect(UsersService.addToChannel("ghost", 5)).rejects.toThrow("WHO_KNOWS");
  });

  it("removes a user from the channel", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, { message: "removed" }));
    const res = await UsersService.removeFromChannel("alice", 5);
    expect(res).toEqual({ message: "removed" });

    const call = calls.find((c) => c.url.endsWith("/api/v1/users/remove-from-channel/"));
    expect(call?.init?.method).toBe("POST");
    expect(JSON.parse(String(call?.init?.body))).toEqual({
      username: "alice",
      chat_id: 5,
    });
  });

  it("maps not-found-in-channel when removing", async () => {
    mockBackendFetch(() => jsonResponse(404, { error: "USER_NOT_FOUND_IN_CHANNEL" }));
    await expect(UsersService.removeFromChannel("ghost", 5))
      .rejects.toBeInstanceOf(BackendUserNotFoundError);
  });

  it("maps not-found-in-database when removing", async () => {
    mockBackendFetch(() => jsonResponse(404, { error: "USER_NOT_FOUND_IN_DATABASE" }));
    await expect(UsersService.removeFromChannel("ghost", 5))
      .rejects.toBeInstanceOf(BackendUserNotFoundError);
  });

  it("passes through unmatched errors when removing", async () => {
    mockBackendFetch(() => jsonResponse(500, { error: "WHO_KNOWS" }));
    await expect(UsersService.removeFromChannel("ghost", 5)).rejects.toThrow("WHO_KNOWS");
  });
});

describe("ChannelUsersService", () => {
  it("returns the nested user from getUserInChannel", async () => {
    mockBackendFetch(() => jsonResponse(200, {
      id: 5,
      user: alice,
      created_at: "t",
      updated_at: "t",
    }));
    const res = await ChannelUsersService.getUserInChannel("alice", 123);
    expect(res).toEqual(alice);
  });

  it("maps not-found when fetching a channel user", async () => {
    mockBackendFetch(() => jsonResponse(404, { error: "USER_NOT_FOUND_IN_CHANNEL" }));
    await expect(ChannelUsersService.getUserInChannel("ghost", 123))
      .rejects.toBeInstanceOf(BackendUserNotFoundError);
  });

  it("tracks a leetcode username", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(201, { ok: true }));
    await ChannelUsersService.track(5, "tgbot", "alice");
    const call = calls.find((c) => c.url.endsWith("/api/v1/channels/5/users/track/"));
    expect(call?.init?.method).toBe("POST");
    expect(JSON.parse(String(call?.init?.body))).toEqual({
      telegram_username: "tgbot",
      leetcode_username: "alice",
    });
  });

  it("maps leetcode-not-found when tracking", async () => {
    mockBackendFetch(() => jsonResponse(400, { error: "USER_NOT_FOUND_IN_LEETCODE" }));
    await expect(ChannelUsersService.track(5, "tgbot", "ghost"))
      .rejects.toBeInstanceOf(LeetCodeUserNotFoundError);
  });

  it("maps already-tracked when tracking", async () => {
    mockBackendFetch(() => jsonResponse(400, { error: "USER_ALREADY_TRACKED" }));
    await expect(ChannelUsersService.track(5, "tgbot", "alice"))
      .rejects.toBeInstanceOf(UserAlreadyTrackedError);
  });

  it("fetches the rank", async () => {
    const rankResponse = { placement: 3, leetcode_username: "alice" };
    const { calls } = mockBackendFetch(() => jsonResponse(200, rankResponse));
    const res = await ChannelUsersService.rank(5, "tgbot");
    expect(res).toEqual(rankResponse);

    const call = calls.find((c) => c.url.endsWith("/api/v1/channels/5/users/rank/"));
    expect(call?.init?.method).toBe("POST");
    expect(JSON.parse(String(call?.init?.body))).toEqual({
      telegram_username: "tgbot",
    });
  });

  it("maps has-no-track when ranking", async () => {
    mockBackendFetch(() => jsonResponse(400, { error: "TELEGRAM_USER_HAS_NO_TRACK" }));
    await expect(ChannelUsersService.rank(5, "tgbot"))
      .rejects.toBeInstanceOf(TelegramUserHasNoTrackError);
  });
});

describe("AuthService", () => {
  it("logs in", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, { message: "ok" }));
    await AuthService.login("user", "pass");
    const call = calls.find((c) => c.url.endsWith("/api/v1/auth/login/"));
    expect(call?.init?.method).toBe("POST");
    expect(JSON.parse(String(call?.init?.body))).toEqual({
      username: "user",
      password: "pass",
    });
  });

  it("logs out with a refresh token", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, { message: "ok" }));
    await AuthService.logout("rt");
    const call = calls.find((c) => c.url.endsWith("/api/v1/auth/logout/"));
    expect(JSON.parse(String(call?.init?.body))).toEqual({ refresh_token: "rt" });
  });

  it("logs out everywhere", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, { message: "ok" }));
    await AuthService.logoutAll();
    const call = calls.find((c) => c.url.endsWith("/api/v1/auth/logout/"));
    expect(JSON.parse(String(call?.init?.body))).toEqual({ logout_all: true });
  });
});

describe("AdminService", () => {
  it("fetches admin data", async () => {
    const { calls } = mockBackendFetch(() => jsonResponse(200, { total_users: 1 }));
    const res = await AdminService.getData();
    expect(res).toEqual({ total_users: 1 });
    const call = calls.find((c) => c.url.endsWith("/api/v1/admin/data/"));
    expect(call).toBeDefined();
  });
});

describe("HealthCheckService", () => {
  it("checks health", async () => {
    const body = {
      status: "ok",
      timestamp: 1,
      database: "ok",
      service: "backend",
      version: "1",
      uptime: 10,
    };
    const { calls } = mockBackendFetch(() => jsonResponse(200, body));
    const res = await HealthCheckService.health();
    expect(res).toEqual(body);
    const call = calls.find((c) => c.url.endsWith("/api/health"));
    expect(call).toBeDefined();
  });
});