import { Context } from "grammy";

interface CommandArg {
  key: string;
  name: string;
  index: number;
  isRequired?: boolean;
  isMultiple?: boolean;
}

interface CommandOptions {
  name: string;
  args?: CommandArg[];
  isAdmin?: boolean;
}

interface CommandMetadata extends CommandOptions {
  handler: (ctx: Context) => Promise<string> | string;
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
