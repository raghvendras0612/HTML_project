export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PostContentType = "text" | "image" | "link";
export type TargetType = "post" | "comment";
export type VoteType = 1 | -1;
export type NotificationType = "reply_post" | "reply_comment" | "moderation";
export type ModeratorRole = "creator" | "moderator";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          karma: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          karma?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          karma?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      communities: {
        Row: {
          id: string;
          name: string;
          title: string;
          description: string;
          icon_url: string | null;
          banner_url: string | null;
          creator_id: string | null;
          members_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          title: string;
          description?: string;
          icon_url?: string | null;
          banner_url?: string | null;
          creator_id?: string | null;
          members_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          title?: string;
          description?: string;
          icon_url?: string | null;
          banner_url?: string | null;
          creator_id?: string | null;
          members_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_members: {
        Row: {
          community_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          community_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          community_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      community_moderators: {
        Row: {
          community_id: string;
          user_id: string;
          role: ModeratorRole;
          added_at: string;
        };
        Insert: {
          community_id: string;
          user_id: string;
          role?: ModeratorRole;
          added_at?: string;
        };
        Update: {
          community_id?: string;
          user_id?: string;
          role?: ModeratorRole;
          added_at?: string;
        };
      };
      community_rules: {
        Row: {
          id: string;
          community_id: string;
          order_index: number;
          title: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          order_index?: number;
          title: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          order_index?: number;
          title?: string;
          description?: string;
          created_at?: string;
        };
      };
      community_bans: {
        Row: {
          community_id: string;
          user_id: string;
          reason: string;
          banned_by: string | null;
          banned_at: string;
        };
        Insert: {
          community_id: string;
          user_id: string;
          reason?: string;
          banned_by?: string | null;
          banned_at?: string;
        };
        Update: {
          community_id?: string;
          user_id?: string;
          reason?: string;
          banned_by?: string | null;
          banned_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          community_id: string;
          author_id: string | null;
          title: string;
          content_type: PostContentType;
          content_text: string | null;
          content_url: string | null;
          score: number;
          upvotes_count: number;
          downvotes_count: number;
          comments_count: number;
          is_pinned: boolean;
          is_removed: boolean;
          hot_score: number;
          fts?: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          author_id?: string | null;
          title: string;
          content_type: PostContentType;
          content_text?: string | null;
          content_url?: string | null;
          score?: number;
          upvotes_count?: number;
          downvotes_count?: number;
          comments_count?: number;
          is_pinned?: boolean;
          is_removed?: boolean;
          hot_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          author_id?: string | null;
          title?: string;
          content_type?: PostContentType;
          content_text?: string | null;
          content_url?: string | null;
          score?: number;
          upvotes_count?: number;
          downvotes_count?: number;
          comments_count?: number;
          is_pinned?: boolean;
          is_removed?: boolean;
          hot_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string | null;
          parent_id: string | null;
          content: string;
          score: number;
          upvotes_count: number;
          downvotes_count: number;
          depth: number;
          is_removed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id?: string | null;
          parent_id?: string | null;
          content: string;
          score?: number;
          upvotes_count?: number;
          downvotes_count?: number;
          depth?: number;
          is_removed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string | null;
          parent_id?: string | null;
          content?: string;
          score?: number;
          upvotes_count?: number;
          downvotes_count?: number;
          depth?: number;
          is_removed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          target_type: TargetType;
          target_id: string;
          vote_type: VoteType;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_type: TargetType;
          target_id: string;
          vote_type: VoteType;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_type?: TargetType;
          target_id?: string;
          vote_type?: VoteType;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          sender_id: string | null;
          type: NotificationType;
          entity_id: string;
          post_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sender_id?: string | null;
          type: NotificationType;
          entity_id: string;
          post_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sender_id?: string | null;
          type?: NotificationType;
          entity_id?: string;
          post_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

// Convenience View Types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type CommunityMember = Database["public"]["Tables"]["community_members"]["Row"];
export type CommunityModerator = Database["public"]["Tables"]["community_moderators"]["Row"];
export type CommunityRule = Database["public"]["Tables"]["community_rules"]["Row"];
export type CommunityBan = Database["public"]["Tables"]["community_bans"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export interface PostWithRelations extends Post {
  author?: Profile | null;
  community?: Community | null;
  user_vote?: VoteType | null;
}

export interface CommentWithRelations extends Comment {
  author?: Profile | null;
  user_vote?: VoteType | null;
  replies?: CommentWithRelations[];
}
