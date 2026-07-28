import { AuthService } from "./auth_service";
import { ChannelsService } from "./channel_service";
import { ContestNotificationsService } from "./contest_notification_service";
import { ContestsService } from "./contest_service";
import { SubscriptionsService } from "./subscription_service";
import { UsersService } from "./user_service";

export class Service {
  static auth = AuthService;
  static users = UsersService;
  static channels = ChannelsService;
  static subscriptions = SubscriptionsService;
  static contests = ContestsService;
  static contestNotifications = ContestNotificationsService;
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
