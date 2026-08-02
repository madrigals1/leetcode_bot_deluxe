// ── API types ──

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Auth types ──

export interface LoginResponse {
  message: string;
  user: { id: number; url: string; username: string };
  tokens: { refresh: string; access: string };
}

// ── User types ──

export interface Submission {
  link: string;
  name: string;
  time: string;
  memory: string;
  status: string;
  runtime: string;
  language: string;
}

export interface User {
  id: number;
  url: string;
  username: string;
  solved: number;
  solved_cml: number;
  data: {
    profile?: {
      realName?: string;
      userAvatar?: string;
    };
    submitStats?: {
      acSubmissionNum: Array<{ difficulty: string; count: number }>;
      totalSubmissionNum: Array<{ difficulty: string; count: number }>;
    };
    computed?: {
      submissions?: Submission[];
    };
    languageStats?: Array<{
      languageName: string;
      problemsSolved: number;
    }>;
  };
  created_at: string;
  updated_at: string;
}

// ── Channel types ──

export interface Channel {
  id: number;
  chat_id: number;
  title: string;
  subscriptions: Array<{ id: number; type: string }>;
}

export interface ChannelUser {
  id: number;
  user: User;
  created_at: string;
  updated_at: string;
}

// ── Rank types ──

export interface NearestAbove {
  username: string;
  solved: number;
  solved_cml: number;
}

export interface RankResponse {
  leetcode_username?: string;
  solved?: number;
  solved_cml?: number;
  placement?: number;
  nearest_above?: NearestAbove;
  solved_to_next?: number;
}

// ── Contest types ──

export interface Contest {
  id: number;
  title: string;
  start_time: string;
  duration: number;
}

// ── Subscription types ──

export interface Subscription {
  id: number;
  channel: { id: number; chat_id: number; title: string };
  type: string;
}

// ── Contest notification types ──

export interface ContestNotification {
  id: number;
  contest: { id: number; title: string; start_time: string };
  subscription: { id: number; type: string };
}

// ── Admin types ──

export interface ScheduledJob {
  id: string;
  last_run_at: string | null;
  last_duration: string | null;
  last_status: string | null;
  next_run_at: string | null;
}

export interface AdminData {
  total_users: number;
  total_channels: number;
  total_channel_users: number;
  total_tracks: number;
  total_subscriptions: number;
  total_contests: number;
  total_contest_notifications: number;
  oldest_updated_user: string | null;
  oldest_updated_at: string | null;
  scheduled_jobs: ScheduledJob[];
}
