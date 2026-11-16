export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PostType = "text" | "image" | "link";
export type MemberRole = "member" | "moderator";
export type TargetType = "post" | "comment";
export type VoteValue = 1 | -1;
export type NotificationType = "post_reply" | "comment_reply";
export type ReportStatus = "open" | "resolved";

export interface CommunityRule {
  title: string;
  body: string;
}

export type Database = {
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
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          karma?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          karma?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      communities: {
        Row: {
          id: string;
          name: string;
          title: string;
          description: string;
          rules: Json;
          icon_url: string | null;
          banner_url: string | null;
          creator_id: string | null;
          member_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          title: string;
          description?: string;
          rules?: Json;
          icon_url?: string | null;
          banner_url?: string | null;
          creator_id?: string | null;
          member_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          title?: string;
          description?: string;
          rules?: Json;
          icon_url?: string | null;
          banner_url?: string | null;
          creator_id?: string | null;
          member_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      community_members: {
        Row: {
          community_id: string;
          user_id: string;
          role: MemberRole;
          joined_at: string;
        };
        Insert: {
          community_id: string;
          user_id: string;
          role?: MemberRole;
          joined_at?: string;
        };
        Update: {
          community_id?: string;
          user_id?: string;
          role?: MemberRole;
          joined_at?: string;
        };
        Relationships: [];
      };
      community_bans: {
        Row: {
          community_id: string;
          user_id: string;
          banned_by: string | null;
          reason: string;
          created_at: string;
        };
        Insert: {
          community_id: string;
          user_id: string;
          banned_by?: string | null;
          reason?: string;
          created_at?: string;
        };
        Update: {
          community_id?: string;
          user_id?: string;
          banned_by?: string | null;
          reason?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          community_id: string;
          author_id: string;
          type: PostType;
          title: string;
          body: string | null;
          url: string | null;
          image_path: string | null;
          score: number;
          comment_count: number;
          is_pinned: boolean;
          is_removed: boolean;
          removed_by: string | null;
          search_tsv?: string;
          created_at: string;
          hot_rank: number;
          moderation_verdict?: string | null;
        };
        Insert: {
          id?: string;
          community_id: string;
          author_id: string;
          type: PostType;
          title: string;
          body?: string | null;
          url?: string | null;
          image_path?: string | null;
          score?: number;
          comment_count?: number;
          is_pinned?: boolean;
          is_removed?: boolean;
          removed_by?: string | null;
          created_at?: string;
          hot_rank?: number;
          moderation_verdict?: string | null;
        };
        Update: {
          id?: string;
          community_id?: string;
          author_id?: string;
          type?: PostType;
          title?: string;
          body?: string | null;
          url?: string | null;
          image_path?: string | null;
          score?: number;
          comment_count?: number;
          is_pinned?: boolean;
          is_removed?: boolean;
          removed_by?: string | null;
          created_at?: string;
          hot_rank?: number;
          moderation_verdict?: string | null;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          parent_id: string | null;
          path: string;
          depth: number;
          body: string;
          score: number;
          is_removed: boolean;
          created_at: string;
          moderation_verdict?: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_id?: string | null;
          path?: string;
          depth?: number;
          body: string;
          score?: number;
          is_removed?: boolean;
          created_at?: string;
          moderation_verdict?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          parent_id?: string | null;
          path?: string;
          depth?: number;
          body?: string;
          score?: number;
          is_removed?: boolean;
          created_at?: string;
          moderation_verdict?: string | null;
        };
        Relationships: [];
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          comment_id: string | null;
          value: VoteValue;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          value: VoteValue;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          value?: VoteValue;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: NotificationType;
          post_id: string;
          comment_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id: string;
          type: NotificationType;
          post_id: string;
          comment_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          actor_id?: string;
          type?: NotificationType;
          post_id?: string;
          comment_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          post_id: string | null;
          comment_id: string | null;
          reason: string;
          status: ReportStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          reason: string;
          status?: ReportStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          reason?: string;
          status?: ReportStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_cache: {
        Row: {
          id: string;
          content_hash: string;
          result: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_hash: string;
          result: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_hash?: string;
          result?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      vote: {
        Args: {
          target_type: "post" | "comment";
          target_id: string;
          value: number;
        };
        Returns: Json;
      };
      is_community_moderator: {
        Args: {
          p_community_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      calculate_hot_rank: {
        Args: {
          score: number;
          created_at: string;
        };
        Returns: number;
      };
    };
    Enums: {
      post_type: PostType;
      member_role: MemberRole;
      notification_type: NotificationType;
      report_status: ReportStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type CommunityMember = Database["public"]["Tables"]["community_members"]["Row"];
export type CommunityBan = Database["public"]["Tables"]["community_bans"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type AICache = Database["public"]["Tables"]["ai_cache"]["Row"];
