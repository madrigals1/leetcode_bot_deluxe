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
