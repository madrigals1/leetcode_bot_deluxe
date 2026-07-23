export class LeetCodeBotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeetCodeBotError";
  }
}

export class InvalidArgumentAmountError extends LeetCodeBotError {
  constructor(expected: number, got: number) {
    super(`Invalid argument count: expected ${expected}, got ${got}.`);
    this.name = `${LeetCodeBotError.name}.InvalidArgumentAmountError`;
  }
}

export class UnauthorizedError extends LeetCodeBotError {
  constructor() {
    super("You don't have permission to use this command.");
    this.name = `${LeetCodeBotError.name}.UnauthorizedError`;
  }
}

export class ChatIdNotFoundError extends LeetCodeBotError {
  constructor() {
    super("Could not determine chat ID.");
    this.name = `${LeetCodeBotError.name}.ChatIdNotFoundError`;
  }
}

export class MatchNotFoundError extends LeetCodeBotError {
  constructor() {
    super("Internal error: match result not found.");
    this.name = `${LeetCodeBotError.name}.MatchNotFoundError`;
  }
}

export class DataNotFoundError extends LeetCodeBotError {
  constructor() {
    super("No data found.");
    this.name = `${LeetCodeBotError.name}.DataNotFoundError`;
  }
}
