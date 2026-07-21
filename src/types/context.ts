import { Context, InlineKeyboard } from "grammy";
import { ChatIdNotFoundError } from "../errors";

export class LbContext {
  public readonly chatId: number;

  constructor(public readonly ctx: Context) {
    if (!ctx.chat?.id) {
      throw new ChatIdNotFoundError();
    }

    this.chatId = ctx.chat.id;
  }

  get match(): RegExpMatchArray | undefined {
    return this.ctx.match as RegExpMatchArray | undefined;
  }

  reply(text: string, options?: { reply_markup?: InlineKeyboard }) {
    return this.ctx.reply(text, options);
  }

  answerCallbackQuery() {
    return this.ctx.answerCallbackQuery();
  }

  editMessageText(text: string, options?: { reply_markup?: InlineKeyboard }) {
    return this.ctx.editMessageText(text, options);
  }
}
