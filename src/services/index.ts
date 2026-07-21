import { authService } from "./auth";
import { channelsService } from "./channels";
import { contestNotificationsService } from "./contestNotifications";
import { contestsService } from "./contests";
import { subscriptionsService } from "./subscriptions";
import { usersService } from "./users";

export class Service {
  static auth = authService;
  static users = usersService;
  static channels = channelsService;
  static subscriptions = subscriptionsService;
  static contests = contestsService;
  static contestNotifications = contestNotificationsService;
}

export type { LoginResponse } from "./auth";
export type { PaginatedResponse } from "./api";
export type { User } from "./users";
export type { Channel } from "./channels";
export type { Subscription } from "./subscriptions";
export type { Contest } from "./contests";
export type { ContestNotification } from "./contestNotifications";
