import { Context } from "grammy";
import type { CommandResponse } from "@/command/response/types";

export interface CommandMetadata {
  name: string;
  description: string;
  args?: { name: string }[];
  requiresAdmin?: boolean;
  handler: (ctx: Context) => CommandResponse | Promise<CommandResponse>;
}

export const COMMANDS_TO_REGISTER: CommandMetadata[] = [];
