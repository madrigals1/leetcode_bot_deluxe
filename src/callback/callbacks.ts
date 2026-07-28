import { callback } from "@/callback";
import { UsersService } from "@/services/backend";
import { VizApiService } from "@/services/vizapi";
import { LbContext } from "@/utils/context";
import { DataNotFoundError } from "@/errors";
import { editPhoto, commandRedirect } from "@/callback/response/shortcuts";

export class Callbacks {
  @callback({ action: /^command:(.+)$/ })
  static onCommandRedirect(lbctx: LbContext) {
    return commandRedirect(lbctx.match[1]);
  }

  @callback({ action: /^submissions:(\d+)$/ })
  static async onSubmissionsUser(lbctx: LbContext) {
    const userId = Number(lbctx.match[1]);
    const user = await UsersService.getById(userId);
    const submissions = user.data?.computed?.submissions ?? [];

    if (submissions.length === 0) {
      throw new DataNotFoundError();
    }

    const table = submissions.slice(0, 10).map((s) => ({
      Name: s.name,
      Time: s.time,
      Language: s.language,
      Status: s.status,
    }));

    const { link } = await VizApiService.generateTable(table);

    return editPhoto({ photo: link });
  }
}
