export interface CommandArg {
  key: string;
  name: string;
  index: number;
  isRequired?: boolean;
  isMultiple?: boolean;
}

export interface CommandOptions {
  name: string;
  args?: CommandArg[];
  isAdmin?: boolean;
}

export interface CommandMetadata extends CommandOptions {
  methodName: string;
}

export function command(options: CommandOptions) {
  return function (
    target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    const owner =
      typeof target === "function" ? target : target.constructor;

    const ctor = owner as typeof owner & { _commands: CommandMetadata[] };

    if (!ctor._commands) {
      ctor._commands = [];
    }

    ctor._commands.push({ ...options, methodName: propertyKey });
  };
}

export function getCommands(target: object): CommandMetadata[] {
  return (
    (target as typeof target & { _commands: CommandMetadata[] })._commands ?? []
  );
}
