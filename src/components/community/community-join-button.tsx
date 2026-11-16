"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CommunityHeaderJoinButtonProps {
  communityName: string;
  initialJoined: boolean;
}

export function CommunityHeaderJoinButton({
  communityName,
  initialJoined,
}: CommunityHeaderJoinButtonProps) {
  const { user, openAuthModal } = useAuth();
  const [joined, setJoined] = React.useState(initialJoined);
  const [loading, setLoading] = React.useState(false);

  const handleToggle = async () => {
    if (!user) {
      openAuthModal("signin");
      return;
    }

    setLoading(true);
    const prev = joined;
    setJoined(!prev); // Optimistic

    try {
      const res = await fetch(`/api/communities/${communityName}/join`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setJoined(data.joined);
        toast.success(data.joined ? `Joined c/${communityName}` : `Left c/${communityName}`);
      } else {
        const err = await res.json();
        setJoined(prev);
        toast.error(err.error || "Failed to update membership");
      }
    } catch {
      setJoined(prev);
      toast.error("Network error updating membership");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={joined ? "outline" : "default"}
      disabled={loading}
      onClick={handleToggle}
      className={`h-8 text-xs ${
        !joined
          ? "bg-accent hover:bg-accent/90 text-white shadow-glow-sm"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : joined ? (
        "Joined"
      ) : (
        "Join"
      )}
    </Button>
  );
}
