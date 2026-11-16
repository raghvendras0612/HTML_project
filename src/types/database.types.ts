export * from "./database";

import type {
  Database,
  Post as BasePost,
  Comment as BaseComment,
  Profile as BaseProfile,
  Community as BaseCommunity,
  Notification as BaseNotification,
  PostType,
} from "./database";

export type VoteType = 1 | -1;
export type PostContentType = PostType;
export type TargetType = "post" | "comment";

export type Profile = BaseProfile & {
  updated_at?: string;
};

export type Community = BaseCommunity & {
  members_count?: number;
  updated_at?: string;
};

export interface PostWithRelations extends BasePost {
  author?: Profile | null;
  community?: Community | null;
  user_vote?: VoteType | null;

  // Compatibility fields
  content_type?: PostType;
  content_text?: string | null;
  content_url?: string | null;
  comments_count?: number;
  upvotes_count?: number;
  downvotes_count?: number;
  hot_score?: number;
  moderation_verdict?: "allow" | "warn" | "block" | string | null;
  updated_at?: string;
}

export interface CommentWithRelations extends BaseComment {
  author?: Profile | null;
  user_vote?: VoteType | null;
  replies?: CommentWithRelations[];
  content?: string;
  upvotes_count?: number;
  downvotes_count?: number;
  moderation_verdict?: "allow" | "warn" | "block" | string | null;
  updated_at?: string;
}

export interface AICache {
  id: string;
  content_hash: string;
  result: Record<string, unknown>;
  created_at: string;
}

export interface NotificationWithRelations extends BaseNotification {
  sender?: Profile | null;
  post?: {
    id: string;
    title: string;
    community?: {
      name: string;
    } | null;
  } | null;
  comment?: {
    id: string;
    body: string;
  } | null;
}

export type Notification = BaseNotification & {
  actor?: Profile | null;
  post?: BasePost | null;
  comment?: BaseComment | null;
};
