"use client";

import * as React from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/common/user-avatar";
import { Sparkles, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { Profile } from "@/types/database";

interface UserHoverCardProps {
  username: string;
  children: React.ReactNode;
  initialProfile?: Partial<Profile> | null;
  className?: string;
}

export function UserHoverCard({
  username,
  children,
  initialProfile,
  className,
}: UserHoverCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<Partial<Profile> | null>(
    initialProfile || null
  );
  const [loading, setLoading] = React.useState(false);
  const openTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const cleanUsername = username.replace(/^u\//, "").trim();

  // Load profile data when card opens
  const fetchProfile = React.useCallback(async () => {
    if (!cleanUsername || cleanUsername === "deleted") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(cleanUsername)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      // Keep initial profile if fetch fails
    } finally {
      setLoading(false);
    }
  }, [cleanUsername]);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    openTimerRef.current = setTimeout(() => {
      setIsOpen(true);
      fetchProfile();
    }, 250);
  };

  const handleMouseLeave = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  React.useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!cleanUsername || cleanUsername === "deleted") {
    return <span className={className}>{children}</span>;
  }

  const joinDate = profile?.created_at
    ? format(new Date(profile.created_at), "MMM yyyy")
    : null;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={className}>{children}</div>

      {isOpen && (
        <div
          role="tooltip"
          data-testid="user-hover-card"
          className="absolute z-50 bottom-full left-0 mb-2 w-72 p-4 rounded-xl bg-surface-raised border border-border/80 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150"
          onMouseEnter={() => {
            if (closeTimerRef.current) {
              clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
          }}
          onMouseLeave={handleMouseLeave}
        >
          {loading && !profile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-surface-overlay animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-24 bg-surface-overlay rounded animate-pulse" />
                  <div className="h-3 w-16 bg-surface-overlay rounded animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-full bg-surface-overlay rounded animate-pulse" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header with Avatar and Names */}
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={profile?.avatar_url}
                  name={profile?.display_name || cleanUsername}
                  className="h-11 w-11 border border-border/80"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-sans font-bold text-sm text-foreground truncate">
                    {profile?.display_name || cleanUsername}
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    u/{cleanUsername}
                  </p>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                {profile?.bio || (
                  <span className="italic text-muted-foreground">No bio provided.</span>
                )}
              </p>

              {/* Stats: Karma & Join Date */}
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-border/50 text-muted-foreground">
                <div
                  className="flex items-center gap-1.5"
                  title={`${profile?.karma ?? 0} total karma`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span className="font-semibold text-foreground">
                    {profile?.karma ?? 0}
                  </span>
                  <span>karma</span>
                </div>
                {joinDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Joined {joinDate}</span>
                  </div>
                )}
              </div>

              {/* Action Link */}
              <Link
                href={`/u/${cleanUsername}`}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-surface-overlay hover:bg-accent/15 hover:text-accent border border-border/60 text-xs font-medium text-foreground transition-colors"
              >
                <span>View profile</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
