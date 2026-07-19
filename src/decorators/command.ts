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
    const constructor = target.constructor as typeof target.constructor & {
      _commands: CommandMetadata[];
    };

    if (!constructor._commands) {
      constructor._commands = [];
    }

    constructor._commands.push({ ...options, methodName: propertyKey });
  };
}

export function getCommands(target: object): CommandMetadata[] {
  return (
    (target as typeof target & { _commands: CommandMetadata[] })._commands ?? []
  );
}
