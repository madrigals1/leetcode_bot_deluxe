import { InvalidArgumentAmountError } from "@/errors";

export type ParsedArgs = Record<string, string>;

export interface CommandArg {
  name: string;
  optional?: boolean;
}

export function parseArgs(text: string, defs: CommandArg[]): ParsedArgs {
  const parts = text.split(/\s+/).slice(1);

  const requiredCount = defs.filter((a) => !a.optional).length;

  if (parts.length < requiredCount) {
    throw new InvalidArgumentAmountError(requiredCount, parts.length);
  }

  if (parts.length > defs.length) {
    throw new InvalidArgumentAmountError(defs.length, parts.length);
  }

  const result: ParsedArgs = {};

  for (let i = 0; i < defs.length; i++) {
    result[defs[i].name] = parts[i] ?? "";
  }

  return result;
}
