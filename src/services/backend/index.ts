import { authService } from "./auth_service";
import { channelsService } from "./channel_service";
import { contestNotificationsService } from "./contest_notification_service";
import { contestsService } from "./contest_service";
import { subscriptionsService } from "./subscription_service";
import { usersService } from "./user_service";

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
