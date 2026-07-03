// ─────────────────────────────────────────────────────────────
// ZeRo youtip — domain types
// ─────────────────────────────────────────────────────────────

export type VideoStatus =
  | "inbox"
  | "queued"
  | "playing"
  | "completed"
  | "archived";

export type VideoPriority = "now" | "this_week" | "later" | "archive";

export type NoteImportance = "low" | "medium" | "high";

export type ActionStatus =
  | "todo"
  | "in_progress"
  | "done"
  | "postponed"
  | "abandoned";

export type UserRole = "admin" | "user";
export type AccountStatus = "active" | "suspended" | "pending";
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  daily_limit_minutes: number;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  invited_by: string | null;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface Vault {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  vault_id: string | null;
  youtube_id: string;
  title: string;
  channel_name: string;
  duration_seconds: number;
  thumbnail_url: string;
  youtube_url: string;
  status: VideoStatus;
  priority: VideoPriority;
  intention: string | null;
  expected_result: string | null;
  max_duration_minutes: number | null;
  listened_seconds: number;
  position_in_queue: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  video_id: string;
  vault_id: string | null;
  content: string;
  timestamp_seconds: number | null;
  tags: string[];
  importance: NoteImportance;
  is_favorite: boolean;
  action_id: string | null;
  created_at: string;
}

export interface Action {
  id: string;
  user_id: string;
  video_id: string | null;
  vault_id: string | null;
  note_id: string | null;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  due_date: string | null;
  status: ActionStatus;
  created_at: string;
}

export interface ListeningSession {
  id: string;
  user_id: string;
  video_id: string;
  started_at: string;
  ended_at: string | null;
  seconds_listened: number;
  intention_rating: number | null;
}

export interface DailyStats {
  user_id: string;
  date: string;
  seconds_listened: number;
  videos_completed: number;
  notes_created: number;
  actions_created: number;
  actions_done: number;
}
