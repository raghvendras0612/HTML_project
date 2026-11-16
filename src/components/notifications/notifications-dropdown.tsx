"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, MessageSquare, ArrowRight, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { toast } from "sonner";
import { formatTimeAgo } from "@/lib/utils";
import type { NotificationWithRelations } from "@/types/database.types";

export function NotificationsDropdown() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  // 1. Fetch latest 10 notifications & unread count
  const { data, refetch } = useQuery<{
    notifications: NotificationWithRelations[];
    unread_count: number;
  }>({
    queryKey: ["notifications", "dropdown"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=10");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: Boolean(user),
    refetchInterval: 30000, // Background sync fallback
  });

  const unreadCount = data?.unread_count ?? 0;
  const notifications = data?.notifications ?? [];

  // 2. Realtime subscription to INSERT events on notifications for current user
  useRealtimeChannel({
    channelName: `user-notifs-${user?.id || "anon"}`,
    table: "notifications",
    event: "INSERT",
    filter: user ? `user_id=eq.${user.id}` : undefined,
    enabled: Boolean(user),
    onEvent: (payload) => {
      // Refresh notifications query cache
      refetch();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Trigger toast alert
      const newNotif = payload.new as { type?: string };
      const desc =
        newNotif.type === "comment_reply"
          ? "Someone replied to your comment"
          : "Someone replied to your post";

      toast(desc, {
        description: "Click bell to review new discussion activity",
        action: {
          label: "View",
          onClick: () => setIsOpen(true),
        },
      });
    },
  });

  // 3. Mark single notification as read & navigate
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // 4. Mark all as read
  const markAllMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "all" }),
      });
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = (notif: NotificationWithRelations) => {
    if (!notif.is_read) {
      markAsReadMutation.mutate(notif.id);
    }
    setIsOpen(false);

    // Target post and comment routing
    const commName = notif.post?.community?.name || "all";
    const postId = notif.post_id;
    const commentId = notif.comment_id;

    if (postId) {
      const targetUrl = commentId
        ? `/c/${commName}/post/${postId}#comment-${commentId}`
        : `/c/${commName}/post/${postId}`;
      router.push(targetUrl);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-surface-raised rounded-full transition-colors focus:outline-none"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />

          {/* Unread count badge capped at 9+ */}
          {unreadCount > 0 && (
            <span
              id="notifications-badge"
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-bold text-white bg-accent rounded-full border-2 border-background shadow-glow-sm animate-in zoom-in-50 duration-200"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 bg-surface border-border p-0 shadow-glow rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/80 bg-surface-raised/40">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent" />
            <span className="text-xs font-bold font-mono">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="cyan" className="text-[10px] h-4 px-1.5 font-mono">
                {unreadCount > 9 ? "9+" : unreadCount} new
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Check className="h-3 w-3" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* List of 10 latest */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground font-mono space-y-1">
              <p>No notifications yet</p>
              <p className="text-[10px] text-muted-foreground/60">
                Replies to your posts and comments will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const actorName = notif.sender?.username || "Someone";
              const commName = notif.post?.community?.name || "curia";
              const titleText =
                notif.type === "comment_reply"
                  ? `u/${actorName} replied to your comment in c/${commName}`
                  : `u/${actorName} replied to your post in c/${commName}`;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-2.5 p-3 text-xs cursor-pointer hover:bg-surface-raised transition-colors ${
                    !notif.is_read ? "bg-accent/5" : ""
                  }`}
                >
                  <Avatar className="h-6 w-6 mt-0.5 border border-border shrink-0">
                    {notif.sender?.avatar_url && (
                      <AvatarImage src={notif.sender.avatar_url} alt={actorName} />
                    )}
                    <AvatarFallback className="text-[9px]">
                      {actorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[11px] text-foreground leading-tight">
                      <strong className="font-semibold text-accent font-mono">
                        u/{actorName}
                      </strong>{" "}
                      {notif.type === "comment_reply" ? "replied to comment in" : "replied to post in"}{" "}
                      <span className="font-mono text-muted-foreground">c/{commName}</span>
                    </p>

                    {notif.comment?.body && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 italic font-sans bg-surface-raised/60 p-1.5 rounded border border-border/50">
                        &ldquo;{notif.comment.body}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <span>{formatTimeAgo(notif.created_at)}</span>
                      {!notif.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Link to full /notifications page */}
        <DropdownMenuSeparator className="bg-border m-0" />
        <Link
          href="/notifications"
          onClick={() => setIsOpen(false)}
          className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono text-accent hover:bg-surface-raised transition-colors font-medium border-t border-border"
        >
          <span>View all notifications</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
