import { Context } from "grammy";
import { CallbackRegistry } from "@/callback/registry";
import { dispatchCallbackResponse } from "@/callback/response/dispatch";
import { editText } from "@/callback/response/shortcuts";
import { LeetCodeBotError } from "@/errors";
import { LbContext } from "@/utils/context";

const wrap = (
  kind: "success" | "domain-error" | "generic-error" | "string-action",
) => ({
  handler: async (ctx: Context) => {
    switch (kind) {
      case "success":
      case "string-action": {
        const lb = new LbContext(ctx);
        await lb.answerCallbackQuery();
        const text =
          kind === "success" ? "done" : `matched: ${lb.chatId}`;
        await dispatchCallbackResponse(lb, editText(text));
        return;
      }
      case "domain-error":
        throw new LeetCodeBotError("domain boom");
      case "generic-error":
        throw new Error("boom");
    }
  },
});

const success = wrap("success");
const stringAction = wrap("string-action");

CallbackRegistry.addCallback({
  action: /^test_success$/,
  ...success,
});
CallbackRegistry.addCallback({
  action: /^test_domain_error$/,
  ...wrap("domain-error"),
});
CallbackRegistry.addCallback({
  action: /^test_generic_error$/,
  ...wrap("generic-error"),
});
CallbackRegistry.addCallback({
  action: "test_string_action",
  ...stringAction,
});