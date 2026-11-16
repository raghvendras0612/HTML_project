"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, MessageSquare, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { formatTimeAgo } from "@/lib/utils";
import { toast } from "sonner";
import type { NotificationWithRelations } from "@/types/database.types";

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = React.useState<"all" | "unread">("all");
  const [page, setPage] = React.useState(0);
  const pageSize = 20;

  const { data, isLoading, refetch } = useQuery<{
    notifications: NotificationWithRelations[];
    total: number;
    unread_count: number;
  }>({
    queryKey: ["notifications", "full-page", activeTab, page],
    queryFn: async () => {
      const unreadParam = activeTab === "unread" ? "&unread_only=true" : "";
      const res = await fetch(
        `/api/notifications?limit=${pageSize}&offset=${page * pageSize}${unreadParam}`
      );
      if (!res.ok) throw new Error("Failed to load notifications");
      return res.json();
    },
    enabled: Boolean(user),
  });

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

  const markOneMutation = useMutation({
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

  const handleNotificationClick = (notif: NotificationWithRelations) => {
    if (!notif.is_read) {
      markOneMutation.mutate(notif.id);
    }

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

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <Card className="curia-card p-8 space-y-4">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-base font-bold">Sign in to view notifications</h2>
          <p className="text-xs text-muted-foreground font-mono">
            Receive updates when others reply to your posts and comments.
          </p>
        </Card>
      </div>
    );
  }

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg border border-border hover:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" />
              <h1 className="text-base font-bold">Your Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="cyan" className="text-[10px] font-mono">
                  {unreadCount > 9 ? "9+" : unreadCount} unread
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Replies, discussions, and updates on your content
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-xs font-mono border-accent/40 text-accent hover:bg-accent/10"
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as "all" | "unread");
            setPage(0);
          }}
        >
          <TabsList className="bg-surface-raised border border-border h-8 p-0.5">
            <TabsTrigger value="all" className="text-xs font-mono h-7 px-3">
              All Notifications
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs font-mono h-7 px-3">
              Unread Only ({unreadCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <span className="text-[11px] font-mono text-muted-foreground">
          Showing {notifications.length} of {total}
        </span>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Notifications List */}
      {!isLoading && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const actorName = notif.sender?.username || "Someone";
            const commName = notif.post?.community?.name || "curia";

            return (
              <Card
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`curia-card border-border/80 p-3.5 cursor-pointer hover:border-accent/50 transition-all ${
                  !notif.is_read ? "bg-accent/5 border-accent/30 shadow-glow-sm" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 mt-0.5 border border-border shrink-0">
                    {notif.sender?.avatar_url && (
                      <AvatarImage src={notif.sender.avatar_url} alt={actorName} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {actorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-foreground">
                        <strong className="font-semibold text-accent font-mono">
                          u/{actorName}
                        </strong>{" "}
                        {notif.type === "comment_reply"
                          ? "replied to your comment in"
                          : "replied to your post in"}{" "}
                        <span className="font-mono font-semibold text-foreground">
                          c/{commName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
                        {formatTimeAgo(notif.created_at)}
                      </span>
                    </div>

                    {notif.comment?.body && (
                      <p className="text-xs text-muted-foreground font-sans bg-surface-raised p-2 rounded-lg border border-border/50 line-clamp-3">
                        &ldquo;{notif.comment.body}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <span>Post: {notif.post?.title || "Discussion"}</span>
                      {!notif.is_read && (
                        <span className="text-accent font-semibold">• Unread</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && notifications.length === 0 && (
        <Card className="curia-card p-12 text-center space-y-3">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold font-mono">No Notifications</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto font-mono">
            {activeTab === "unread"
              ? "You've read all your notifications!"
              : "No activity to display yet. Post and comment in communities to start conversations."}
          </p>
        </Card>
      )}

      {/* Pagination Controls */}
      {total > pageSize && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="text-xs font-mono"
          >
            Previous
          </Button>
          <span className="text-xs font-mono text-muted-foreground">
            Page {page + 1} of {Math.ceil(total / pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(page + 1) * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
            className="text-xs font-mono"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
