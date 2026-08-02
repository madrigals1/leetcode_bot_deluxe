import { boldUsername } from "@/utils/format";

export class LeetCodeBotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeetCodeBotError";
  }
}

export class InvalidArgumentAmountError extends LeetCodeBotError {
  constructor(expected: number, got: number, example?: string) {
    let message = `❗ Invalid argument count: expected ${expected}, got ${got}.`;

    if (example) {
      message += example;
    }

    super(message);
    this.name = `${LeetCodeBotError.name}.InvalidArgumentAmountError`;
  }
}

export class UnauthorizedError extends LeetCodeBotError {
  constructor() {
    super("❗ You don't have permission to use this command.");
    this.name = `${LeetCodeBotError.name}.UnauthorizedError`;
  }
}

export class ChatIdNotFoundError extends LeetCodeBotError {
  constructor() {
    super("❗ Could not determine chat ID.");
    this.name = `${LeetCodeBotError.name}.ChatIdNotFoundError`;
  }
}

export class TelegramUsernameNotFoundError extends LeetCodeBotError {
  constructor() {
    super("❗ Could not determine your Telegram username.");
    this.name = `${LeetCodeBotError.name}.TelegramUsernameNotFoundError`;
  }
}

export class MatchNotFoundError extends LeetCodeBotError {
  constructor() {
    super("❗ Internal error: match result not found.");
    this.name = `${LeetCodeBotError.name}.MatchNotFoundError`;
  }
}

export class DataNotFoundError extends LeetCodeBotError {
  constructor() {
    super("❗ No data found.");
    this.name = `${LeetCodeBotError.name}.DataNotFoundError`;
  }
}

export class BackendNotAvailableError extends LeetCodeBotError {
  constructor() {
    super("❗ Backend is not available.");
    this.name = `${LeetCodeBotError.name}.BackendNotAvailableError`;
  }
}

export class BotNotInitializedError extends LeetCodeBotError {
  constructor() {
    super("❗ Bot is not initialized.");
    this.name = `${LeetCodeBotError.name}.BotNotInitializedError`;
  }
}

export class VizApiNotAvailableError extends LeetCodeBotError {
  constructor() {
    super("❗ VizAPI is not available.");
    this.name = `${LeetCodeBotError.name}.VizApiNotAvailableError`;
  }
}

export class BackendUserNotFoundError extends LeetCodeBotError {
  constructor(username: string) {
    super(`❗ User ${boldUsername(username)} was not found in this channel.`);
    this.name = `${LeetCodeBotError.name}.BackendUserNotFoundError`;
  }
}

export class TelegramUserHasNoTrackError extends LeetCodeBotError {
  constructor() {
    super(
      `❗ You need to track a LeetCode username first.\n`
      + `Use <b>/track leetcode_username</b> to start tracking.`
    );
    this.name = `${LeetCodeBotError.name}.TelegramUserHasNoTrackError`;
  }
}

export class LeetCodeUserNotFoundError extends LeetCodeBotError {
  constructor(username: string) {
    super(`❗ User ${boldUsername(username)} does not exist in LeetCode.`);
    this.name = `${LeetCodeBotError.name}.LeetCodeUserNotFoundError`;
  }
}

export class UserAlreadyInChannelError extends LeetCodeBotError {
  constructor(username: string) {
    super(`⚠️ User ${boldUsername(username)} is already added to this channel.`);
    this.name = `${LeetCodeBotError.name}.UserAlreadyInChannelError`;
  }
}
