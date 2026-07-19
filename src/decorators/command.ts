import { Context, InlineKeyboard } from "grammy";

interface CommandArg {
  key: string;
  name: string;
  index: number;
  isRequired?: boolean;
  isMultiple?: boolean;
}

interface CommandResponse {
  text: string;
  reply_markup?: InlineKeyboard;
}

interface CommandOptions {
  name: string;
  args?: CommandArg[];
  isAdmin?: boolean;
}

interface CommandMetadata extends CommandOptions {
  handler: (
    ctx: Context,
    args: Record<string, string>,
  ) => CommandResponse | Promise<CommandResponse>;
}

export const commandsRegisteredByDecorator: CommandMetadata[] = [];

export function command(options: CommandOptions) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    commandsRegisteredByDecorator.push({
      ...options,
      handler: descriptor.value,
    });
  };
}

export function parseArgs(
  text: string,
  defs: CommandArg[],
): Record<string, string> {
  const parts = text.split(/\s+/).slice(1);
  const result: Record<string, string> = {};

  for (const def of defs) {
    if (def.isMultiple) {
      result[def.key] = parts.slice(def.index).join(" ");
    } else {
      result[def.key] = parts[def.index] ?? "";
    }
  }

  return result;
}
