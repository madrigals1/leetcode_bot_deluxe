import { Context } from "grammy";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataNotFoundError, InvalidArgumentAmountError, LeetCodeBotError } from "@/errors";
import { trackedAlice, alice, bob } from "../../tests/fixtures/users";
import { makeFakeBot } from "../../tests/helpers/makeFakeBot";
import { makeFakeContext } from "../../tests/helpers/makeFakeContext";
import Commands from "./commands";
import { CommandRegistry } from "./registry";
import { LbContext } from "@/utils/context";
import type {
  EditTextResponse,
  PaginatedButtonsResponse,
  PaginatedTextResponse,
  PhotoResponse,
  TextResponse,
} from "./types";

const services = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    UsersService: { addToChannel: fn(), removeFromChannel: fn() },
    ChannelsService: { getUsersSimplified: fn(), refresh: fn() },
    ChannelUsersService: { track: fn(), rank: fn(), getUserInChannel: fn() },
    AdminService: { getData: fn() },
    VizApiService: { generateTable: fn(), generatePie: fn(), generateCompare: fn() },
  };
});

vi.mock("@/services/backend", () => ({
  UsersService: services.UsersService,
  ChannelsService: services.ChannelsService,
  ChannelUsersService: services.ChannelUsersService,
  AdminService: services.AdminService,
}));

vi.mock("@/services/vizapi", () => ({
  VizApiService: services.VizApiService,
}));

const channelUsers = {
  count: 3,
  next: null,
  previous: null,
  results: [{ user: alice }, { user: bob }],
};

const adminData = {
  total_users: 10,
  total_channels: 2,
  total_channel_users: 20,
  total_tracks: 15,
  total_subscriptions: 5,
  total_contests: 3,
  total_contest_notifications: 1,
  oldest_updated_user: "alice",
  oldest_updated_at: "2024-01-01T00:00:00Z",
  scheduled_jobs: [
    {
      id: "job-1",
      last_run_at: null,
      last_duration: null,
      last_status: null,
      next_run_at: "2024-01-05T00:00:00Z",
    },
  ],
};

function lb(ctx = makeFakeContext() as unknown as Context): LbContext {
  return new LbContext(ctx);
}

function ctxWithText(text: string, chatId = 123) {
  const ctx = makeFakeContext({ chatId }) as unknown as Context & {
    message: { text: string };
    reply: ReturnType<typeof vi.fn>;
  };
  ctx.message = { text };
  return ctx;
}

beforeEach(() => {
  for (const group of Object.values(services)) {
    for (const fn of Object.values(group)) {
      fn.mockReset();
    }
  }
});

describe("Commands", () => {
  it("start", async () => {
    const res = await Commands.start() as TextResponse;
    expect(res.type).toBe("text");
    expect(res.text).toContain("Welcome to the LeetCode BOT.");
  });

  it("commands", async () => {
    const res = await Commands.commands() as TextResponse;
    expect(res.text).toContain("- <b>/start</b>");
    expect(res.text).toContain("- <b>/track</b>");
    expect(res.text).not.toContain("/botfather");
    expect(res.text).not.toContain("superadmin");
  });

  it("botfather", async () => {
    const res = await Commands.botfather() as TextResponse;
    expect(res.text).toContain("start - 🚀 Start the bot");
    expect(res.buttons?.inline_keyboard).toEqual([
      [{ text: "🛡️ Superadmin", callback_data: "command:superadmin" }],
    ]);
  });

  it("superadmin renders stats and jobs", async () => {
    services.ChannelsService.getUsersSimplified.mockResolvedValue({
      ...channelUsers,
      count: 7,
    });
    services.AdminService.getData.mockResolvedValue(adminData);

    const res = await Commands.superadmin(lb()) as TextResponse;
    expect(res.text).toContain("Channel ID: <code>123</code>");
    expect(res.text).toContain("Users in channel: <b>7</b>");
    expect(res.text).toContain("Total users: <b>10</b>");
    expect(res.text).toContain("Oldest updated: <b>alice</b>");
    expect(res.text).toContain("job-1");
  });

  it("superadmin falls back to dashes without oldest user data", async () => {
    services.ChannelsService.getUsersSimplified.mockResolvedValue(channelUsers);
    services.AdminService.getData.mockResolvedValue({
      ...adminData,
      oldest_updated_user: null,
      oldest_updated_at: null,
      scheduled_jobs: [],
    });

    const res = await Commands.superadmin(lb()) as TextResponse;
    expect(res.text).toContain("Oldest updated: <b>-</b>");
    expect(res.text).toContain("Scheduled jobs:");
  });

  it("chatid", async () => {
    const res = await Commands.chatid(lb()) as TextResponse;
    expect(res.text).toBe("💬 Chat ID: <code>123</code>");
  });

  it("add", async () => {
    services.UsersService.addToChannel.mockResolvedValue({ message: "added" });

    const res = await Commands.add(lb(), { username: "alice" }) as TextResponse;
    expect(res.text).toBe('✅ User <b>"alice"</b> was successfully added.');
    expect(services.UsersService.addToChannel).toHaveBeenCalledWith("alice", 123);
  });

  it("remove with a username", async () => {
    services.UsersService.removeFromChannel.mockResolvedValue({ message: "removed" });

    const res = await Commands.remove(lb(), { username: "bob" }) as TextResponse;
    expect(res.text).toBe('✅ User <b>"bob"</b> was successfully removed.');
    expect(services.UsersService.removeFromChannel).toHaveBeenCalledWith("bob", 123);
  });

  it("remove without a username shows a picker", async () => {
    const res = await Commands.remove(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(res.type).toBe("paginatedButtons");
    expect(res.name).toBe("remove");
  });

  it("track", async () => {
    services.ChannelUsersService.track.mockResolvedValue(undefined);

    const res = await Commands.track(lb(), { leetcode_username: "carol" }) as TextResponse;
    expect(services.ChannelUsersService.track).toHaveBeenCalledWith(123, "alice", "carol");
    expect(res.text).toContain('Now tracking <b>"carol"</b> on LeetCode.');
  });

  it("refresh replies, refreshes and edits the message", async () => {
    services.ChannelsService.refresh.mockResolvedValue({ detail: "ok" });
    const ctx = ctxWithText("/refresh") as unknown as Context & {
      reply: ReturnType<typeof vi.fn>;
    };
    ctx.reply.mockResolvedValue({ message_id: 42 });

    const res = await Commands.refresh(lb(ctx)) as EditTextResponse;
    expect(res.type).toBe("editText");
    expect(res.message_id).toBe(42);
    expect(res.text).toContain("has been refreshed");
    expect(ctx.reply).toHaveBeenCalledWith("🔄 Fetching data from LeetCode to the database...");
    expect(services.ChannelsService.refresh).toHaveBeenCalledWith(123);
  });

  it("myrank renders the full ranking", async () => {
    services.ChannelUsersService.rank.mockResolvedValue({
      leetcode_username: "alice",
      solved: 10,
      solved_cml: 15,
      placement: 3,
      nearest_above: { username: "carol", solved: 20, solved_cml: 30 },
      solved_to_next: 5,
      last_refreshed: "2024-01-01T00:00:00Z",
    });

    const res = await Commands.myrank(lb()) as TextResponse;
    expect(res.text).toContain("Placement: <b>#3</b>");
    expect(res.text).toContain("Username: <b>alice</b>");
    expect(res.text).toContain("Solved: <b>10</b> (15 cumulative)");
    expect(res.text).toContain("User ahead: <b>carol</b>");
    expect(res.text).toContain("Problems needed to advance: <b>5</b>");
    expect(res.text).toContain("Last refreshed:");
  });

  it("myrank explains when the user has no tracking", async () => {
    services.ChannelUsersService.rank.mockResolvedValue({});

    const res = await Commands.myrank(lb()) as TextResponse;
    expect(res.text).toContain("You are not tracking anyone in this channel.");
  });

  it("myrank renders a bare placement", async () => {
    services.ChannelUsersService.rank.mockResolvedValue({ placement: 1 });

    const res = await Commands.myrank(lb()) as TextResponse;
    expect(res.text).toBe('Placement: <b>#1</b> 🏆\n\n<blockquote>💡 You can change your tracked username with: <b>/track username</b>.</blockquote>');
  });

  it("rating", async () => {
    const res = await Commands.rating() as PaginatedTextResponse;
    expect(res.type).toBe("paginatedText");
    expect(res.name).toBe("rating");

    await res.fetchPage(2, lb());
    expect(services.ChannelsService.getUsersSimplified).toHaveBeenCalledWith(123, 2);
  });

  it("ratingCml", async () => {
    const res = await Commands.ratingCml() as PaginatedTextResponse;
    expect(res.name).toBe("rating_cml");
    expect(res.header).toContain("🟢 Easy - 0.5 points");

    await res.fetchPage(1, lb());
    expect(services.ChannelsService.getUsersSimplified)
      .toHaveBeenCalledWith(123, 1, "-user__solved_cml");
  });

  it("profile with a username", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(trackedAlice);

    const res = await Commands.profile(lb(), { username: "alice" }) as TextResponse;
    expect(res.text).toContain("Alice A");
    expect(res.text).toContain("https://leetcode.com/alice");
    expect(res.text).toContain("🟢 Easy - <b>60</b>");
    expect(res.text).toContain("🟡 Medium - <b>45</b>");
    expect(res.text).toContain("🔴 Hard - <b>15</b>");
    expect(res.text).toContain("🔵 All - <b>120 / 200</b>");
    expect(res.text).toContain("🔷 Cumulative - <b>320.5</b>");
  });

  it("profile falls back to the username without a real name", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(bob);

    const res = await Commands.profile(lb(), { username: "bob" }) as TextResponse;
    expect(res.text).toContain("bob");
  });

  it("profile without a username shows a picker", async () => {
    const res = await Commands.profile(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(res.type).toBe("paginatedButtons");
    expect(res.name).toBe("profile");
  });

  it("avatar with an avatar URL", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(trackedAlice);

    const res = await Commands.avatar(lb(), { username: "alice" }) as PhotoResponse;
    expect(res.type).toBe("photo");
    expect(res.photo).toBe("https://avatar.example/alice.png");
  });

  it("avatar without an avatar URL", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(bob);

    const res = await Commands.avatar(lb(), { username: "bob" }) as TextResponse;
    expect(res.type).toBe("text");
    expect(res.text).toBe("❗ No avatar found.");
  });

  it("avatar without a username shows a picker", async () => {
    const res = await Commands.avatar(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(res.name).toBe("avatar");
  });

  it("langstats with stats", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(trackedAlice);

    const res = await Commands.langstats(lb(), { username: "alice" }) as TextResponse;
    expect(res.text).toContain('<b>"alice"</b>');
    expect(res.text.indexOf("Python3")).toBeLessThan(res.text.indexOf("SQL"));
  });

  it("langstats throws DataNotFoundError when there are no stats", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(bob);

    await expect(Commands.langstats(lb(), { username: "bob" }))
      .rejects.toBeInstanceOf(DataNotFoundError);
  });

  it("langstats without a username shows a picker", async () => {
    const res = await Commands.langstats(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(res.name).toBe("langstats");
  });

  it("submissions renders a table image", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(trackedAlice);
    services.VizApiService.generateTable.mockResolvedValue({ link: "https://img/table" });

    const res = await Commands.submissions(lb(), { username: "alice" }) as PhotoResponse;
    expect(res.type).toBe("photo");
    expect(res.photo).toBe("https://img/table");
    expect(services.VizApiService.generateTable).toHaveBeenCalledWith([
      { Name: "Two Sum", Time: "2024-01-01T00:00:00Z", Language: "python3", Status: "Accepted" },
      { Name: "Add Two Numbers", Time: "2024-01-01T00:01:00Z", Language: "python3", Status: "Accepted" },
    ]);
  });

  it("submissions without submissions raises DataNotFoundError", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(bob);

    await expect(
      Commands.submissions(lb(), { username: "bob" }),
    ).rejects.toThrow(DataNotFoundError);
  });

  it("submissions without a username shows a picker", async () => {
    const res = await Commands.submissions(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(res.name).toBe("submissions");
  });

  it("problems renders a pie chart", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(trackedAlice);
    services.VizApiService.generatePie.mockResolvedValue({ link: "https://img/pie" });

    const res = await Commands.problems(lb(), { username: "alice" }) as PhotoResponse;
    expect(res.type).toBe("photo");
    expect(res.photo).toBe("https://img/pie");
    expect(services.VizApiService.generatePie).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Problems solved by alice",
        sliceData: [
          { sliceName: "Easy", sliceValue: 60, sliceColor: "#22c55e" },
          { sliceName: "Medium", sliceValue: 45, sliceColor: "#eab308" },
          { sliceName: "Hard", sliceValue: 15, sliceColor: "#ef4444" },
        ],
      }),
    );
  });

  it("problems without a username shows a picker", async () => {
    const res = await Commands.problems(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(res.name).toBe("problems");
  });

  it("compare with both usernames", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(alice);
    services.VizApiService.generateCompare.mockResolvedValue({ link: "https://img/compare" });

    const res = await Commands.compare(lb(), { username1: "alice", username2: "bob" }) as PhotoResponse;
    expect(res.type).toBe("photo");
    expect(res.photo).toBe("https://img/compare");
    expect(services.ChannelUsersService.getUserInChannel)
      .toHaveBeenNthCalledWith(1, "alice", 123);
    expect(services.ChannelUsersService.getUserInChannel)
      .toHaveBeenNthCalledWith(2, "bob", 123);
    expect(services.VizApiService.generateCompare).toHaveBeenCalledWith(
      expect.objectContaining({
        left: expect.objectContaining({ image: "https://avatar.example/alice.png" }),
        right: expect.objectContaining({ image: "https://avatar.example/alice.png" }),
      }),
    );
  });

  it("compare with one username asks for the second", async () => {
    const res = await Commands.compare(lb(), { username1: "alice", username2: "" }) as PaginatedButtonsResponse;
    expect(res.type).toBe("paginatedButtons");
    expect(res.name).toBe("compare");
    expect(res.itemToButton({ user: bob })).toEqual({
      text: "bob",
      callback_data: "command:compare alice bob",
    });
  });

  it("compare without usernames asks for the first", async () => {
    const res = await Commands.compare(lb(), { username1: "", username2: "" }) as PaginatedButtonsResponse;
    expect(res.name).toBe("compare");
    expect(res.text).toContain("Select first user to compare:");
    expect(res.itemToButton({ user: alice })).toEqual({
      text: "alice",
      callback_data: "command:compare alice",
    });
  });

  it("problems renders zeroed slices without submit stats", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(bob);
    services.VizApiService.generatePie.mockResolvedValue({ link: "https://img/pie0" });

    const res = await Commands.problems(lb(), { username: "bob" }) as PhotoResponse;
    expect(res.photo).toBe("https://img/pie0");
    expect(services.VizApiService.generatePie).toHaveBeenCalledWith(
      expect.objectContaining({
        sliceData: [
          { sliceName: "Easy", sliceValue: 0, sliceColor: "#22c55e" },
          { sliceName: "Medium", sliceValue: 0, sliceColor: "#eab308" },
          { sliceName: "Hard", sliceValue: 0, sliceColor: "#ef4444" },
        ],
      }),
    );
  });

  it("fetches a page for every paginated command", async () => {
    services.ChannelsService.getUsersSimplified.mockResolvedValue(channelUsers);

    const pickers: PaginatedButtonsResponse[] = [
      await Commands.remove(lb(), { username: "" }),
      await Commands.profile(lb(), { username: "" }),
      await Commands.avatar(lb(), { username: "" }),
      await Commands.langstats(lb(), { username: "" }),
      await Commands.submissions(lb(), { username: "" }),
      await Commands.problems(lb(), { username: "" }),
      await Commands.compare(lb(), { username1: "alice", username2: "" }),
      await Commands.compare(lb(), { username1: "", username2: "" }),
    ];

    for (const picker of pickers) {
      await picker.fetchPage(1, lb());
    }

    expect(services.ChannelsService.getUsersSimplified).toHaveBeenCalledTimes(8);
    expect(services.ChannelsService.getUsersSimplified)
      .toHaveBeenLastCalledWith(123, 1);
  });

  it("formats buttons and items for every paginated command", async () => {
    const remove = await Commands.remove(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(remove.itemToButton({ user: bob })).toEqual({
      text: "bob",
      callback_data: "command:remove bob",
    });

    const profile = await Commands.profile(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(profile.itemToButton({ user: bob }).callback_data).toBe("command:profile bob");

    const avatar = await Commands.avatar(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(avatar.itemToButton({ user: bob }).callback_data).toBe("command:avatar bob");

    const langstats = await Commands.langstats(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(langstats.itemToButton({ user: bob }).callback_data).toBe("command:langstats bob");

    const submissions = await Commands.submissions(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(submissions.itemToButton({ user: bob }).callback_data).toBe("command:submissions bob");

    const problems = await Commands.problems(lb(), { username: "" }) as PaginatedButtonsResponse;
    expect(problems.itemToButton({ user: bob }).callback_data).toBe("command:problems bob");

    const compareOne = await Commands.compare(lb(), { username1: "alice", username2: "" }) as PaginatedButtonsResponse;
    expect(compareOne.itemToButton({ user: bob }).callback_data).toBe("command:compare alice bob");

    const compareNone = await Commands.compare(lb(), { username1: "", username2: "" }) as PaginatedButtonsResponse;
    expect(compareNone.itemToButton({ user: alice }).callback_data).toBe("command:compare alice");

    const rating = Commands.rating() as PaginatedTextResponse;
    expect(rating.formatItem?.(channelUsers.results[0], 0)).toBe("1. <b>alice</b> 120");

    const ratingCml = Commands.ratingCml() as PaginatedTextResponse;
    expect(ratingCml.formatItem?.(channelUsers.results[0], 0)).toBe("1. <b>alice</b> 320.5");
  });

  it("runs track through its decorated wrapper", async () => {
    services.ChannelUsersService.track.mockResolvedValue(undefined);

    const fake = makeFakeBot();
    CommandRegistry.setBot(fake.bot);
    CommandRegistry.registerAllCommands();

    const handler = fake.registeredCommands.get("track")!;
    const ctx = ctxWithText("/track Bob");
    await handler(ctx);

    expect(services.ChannelUsersService.track).toHaveBeenCalledWith(123, "alice", "bob");
    expect(ctx.reply).toHaveBeenCalledWith(
      '✅ Now tracking <b>"bob"</b> on LeetCode. Use <b>/myrank</b> to see ranking for <b>"bob"</b>.',
      { reply_markup: undefined },
    );
  });

  it("rejects missing required arguments through the wrapper", async () => {
    const handler = (CommandRegistry as unknown as {
      commands: Array<{ name: string; handler: (ctx: Context) => unknown }>;
    }).commands.find((c) => c.name === "track")!.handler;

    await expect(handler(ctxWithText("/track"))).rejects.toThrow(
      InvalidArgumentAmountError,
    );
  });

  it("enforces superadmin-only commands through the wrapper", async () => {
    const handler = (CommandRegistry as unknown as {
      commands: Array<{ name: string; handler: (ctx: Context) => unknown }>;
    }).commands.find((c) => c.name === "superadmin")!.handler;

    await expect(handler(ctxWithText("/superadmin")))
      .rejects.toThrow("You don't have permission to use this command.");
  });

  it("runs a photo command through its decorated wrapper", async () => {
    services.ChannelUsersService.getUserInChannel.mockResolvedValue(trackedAlice);

    const handler = (CommandRegistry as unknown as {
      commands: Array<{ name: string; handler: (ctx: Context) => unknown }>;
    }).commands.find((c) => c.name === "avatar")!.handler;

    const ctx = ctxWithText("/avatar Alice") as unknown as Context & {
      replyWithPhoto: ReturnType<typeof vi.fn>;
    };
    ctx.replyWithPhoto = vi.fn().mockResolvedValue({ message_id: 7 });
    await handler(ctx);

    expect(ctx.replyWithPhoto).toHaveBeenCalledWith("https://avatar.example/alice.png", {
      caption: undefined,
      reply_markup: undefined,
    });
  });

  it("treats a missing message text as empty args", async () => {
    const handler = (CommandRegistry as unknown as {
      commands: Array<{ name: string; handler: (ctx: Context) => unknown }>;
    }).commands.find((c) => c.name === "start")!.handler;

    const ctx = makeFakeContext() as unknown as Context & {
      reply: ReturnType<typeof vi.fn>;
    };
    await handler(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("Welcome to the LeetCode BOT."),
      { reply_markup: undefined },
    );
  });

  it.each([
    [
      "error",
      async () => {
        throw new Error("boom");
      },
      "❗ An error occurred.",
    ],
    [
      "domain error",
      async () => {
        throw new LeetCodeBotError("domain boom");
      },
      "domain boom",
    ],
    [
      "non-error",
      async () => {
        throw "boom";
      },
      "❗ An error occurred.",
    ],
  ])("replies gracefully when the wrapper catches a %s", async (_name, impl, expectedReply) => {
    const fake = makeFakeBot();
    CommandRegistry.setBot(fake.bot);
    const name = `wrapped_${_name.replace(/\s/g, "_")}_${Math.random().toString(36).slice(2)}`;
    CommandRegistry.addCommand({
      name,
      description: "demo",
      originalFn: impl,
      handler: impl as () => Promise<unknown>,
    });

    CommandRegistry.registerAllCommands();
    const handler = fake.registeredCommands.get(name)!;
    const ctx = ctxWithText(`/${name}`);
    await handler(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expectedReply);
  });
});