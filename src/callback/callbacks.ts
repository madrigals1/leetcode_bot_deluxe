import { callback } from "@/callback";
import { LbContext } from "@/utils/context";
import { commandRedirect } from "@/callback/response/shortcuts";

export class Callbacks {
  @callback({ action: /^command:(.+)$/ })
  static onCommandRedirect(lbctx: LbContext) {
    return commandRedirect(lbctx.match[1]);
  }
}
