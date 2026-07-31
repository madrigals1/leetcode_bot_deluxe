import { ApiService } from "./api_service";
import type { ChannelUser, RankResponse } from "./types";
import { telegramUserHasNoClaim, userNotFound } from "@/errors/catchers";

export class ChannelUsersService {
  static getUserInChannel(username: string, chatId: number) {
    return ApiService
      .fetch<ChannelUser>(`/api/v1/channels/${chatId}/users/${username}/`)
      .then(data => data.user)
      .catch(userNotFound(username, chatId));
  }

  static track(chatId: number, telegramUsername: string, leetcodeUsername: string) {
    return ApiService.fetch<ChannelUser>(
      `/api/v1/channels/${chatId}/users/iam/`,
      {
        method: "POST",
        body: JSON.stringify({
          telegram_username: telegramUsername,
          leetcode_username: leetcodeUsername,
        }),
      },
    );
  }

  static rank(chatId: number, telegramUsername: string) {
    return ApiService.fetch<RankResponse>(
      `/api/v1/channels/${chatId}/users/rank/`,
      {
        method: "POST",
        body: JSON.stringify({ telegram_username: telegramUsername }),
      },
    ).catch(telegramUserHasNoClaim());
  }
}
