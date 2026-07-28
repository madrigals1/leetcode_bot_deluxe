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

export type {
  LoginResponse,
  PaginatedResponse,
  User,
  Submission,
  Channel,
  ChannelUser,
  Contest,
  Subscription,
  ContestNotification,
} from "./types";
