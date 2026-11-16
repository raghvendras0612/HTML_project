"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, X, Check, MessageSquare, Shield, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/utils";
import type { Notification } from "@/types/database.types";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsDrawer({ open, onClose }: NotificationsDrawerProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isMarking, setIsMarking] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const fetchNotifs = async () => {
        try {
          const res = await fetch("/api/notifications");
          const data = await res.json();
          if (data.notifications) {
            setNotifications(data.notifications);
          }
        } catch {
          // Ignored
        }
      };
      fetchNotifs();
    }
  }, [open]);

  const markAllAsRead = async () => {
    setIsMarking(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "all" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // Ignored
    } finally {
      setIsMarking(false);
    }
  };

  const markOneAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // Ignored
    }
  };

  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-sm bg-surface border-l border-border h-full p-4 overflow-y-auto z-10 space-y-4 shadow-glow animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent" />
            <h2 className="font-bold text-sm text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="cyan" className="text-[10px] h-4 px-1.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isMarking}
                className="text-[11px] h-7 font-mono text-accent"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markOneAsRead(notif.id)}
                className={`p-3 rounded-xl border text-xs space-y-1 transition-colors cursor-pointer ${
                  notif.is_read
                    ? "bg-surface-raised/40 border-border/60 text-muted-foreground"
                    : "bg-surface-raised border-accent/30 text-foreground shadow-glow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {notif.type === "reply_comment" && (
                      <MessageSquare className="h-3.5 w-3.5 text-accent-glow" />
                    )}
                    {notif.type === "reply_post" && (
                      <MessageSquare className="h-3.5 w-3.5 text-accent" />
                    )}
                    {notif.type === "moderation" && (
                      <Shield className="h-3.5 w-3.5 text-danger" />
                    )}
                    <span className="font-mono text-[11px] font-semibold">
                      {notif.type === "reply_comment"
                        ? "New reply to your comment"
                        : notif.type === "reply_post"
                        ? "New comment on your post"
                        : "Moderation notice"}
                    </span>
                  </div>
                  {!notif.is_read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-glow" />
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {notif.post_id ? (
                    <Link
                      href={`/c/webdev/comments/${notif.post_id}`}
                      className="hover:underline text-foreground"
                      onClick={onClose}
                    >
                      Click to jump directly to this discussion thread →
                    </Link>
                  ) : (
                    "Action recorded on your activity."
                  )}
                </p>

                <p className="font-mono text-[10px] text-muted-foreground/70 pt-1">
                  {formatTimeAgo(notif.created_at)}
                </p>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground font-mono">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p>You have no notifications yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
