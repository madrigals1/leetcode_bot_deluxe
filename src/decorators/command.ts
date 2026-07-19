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
  methodName: string;
}

export const commandsRegisteredByDecorator: CommandMetadata[] = [];

export function command(options: CommandOptions) {
  return function (
    _target: object,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    commandsRegisteredByDecorator.push({ ...options, methodName: propertyKey });
  };
}
