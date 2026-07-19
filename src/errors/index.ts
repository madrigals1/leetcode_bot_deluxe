export class InvalidArgumentAmountError extends Error {
  constructor(expected: number, got: number) {
    super(`Invalid argument count: expected ${expected}, got ${got}.`);
    this.name = "InvalidArgumentAmountError";
  }
}
