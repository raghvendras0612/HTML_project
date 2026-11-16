"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Sparkles, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function OnboardingModal() {
  const { profile, needsOnboarding, setNeedsOnboarding, refreshProfile } = useUser();
  const [username, setUsername] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [isValid, setIsValid] = React.useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      if (profile.username && !profile.username.startsWith("user_")) {
        setUsername(profile.username);
      }
    }
  }, [profile]);

  // Debounced live username check
  React.useEffect(() => {
    if (!username || username.length < 3) {
      setIsValid(null);
      setErrorMsg(username && username.length < 3 ? "At least 3 characters" : null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username.toLowerCase())}`);
        const data = await res.json();
        setIsValid(data.valid);
        setErrorMsg(data.error);
      } catch {
        setIsValid(null);
      } finally {
        setChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !username.trim() || !displayName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/update-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          display_name: displayName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to update profile");
        return;
      }

      toast.success("Welcome to Curia! Your profile is set.");
      setNeedsOnboarding(false);
      await refreshProfile();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={needsOnboarding} onOpenChange={setNeedsOnboarding}>
      <DialogContent className="sm:max-w-md bg-surface border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-accent mb-1">
            <Sparkles className="h-5 w-5 text-accent-glow" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">Welcome to Curia</span>
          </div>
          <DialogTitle className="text-xl font-bold">Choose your handle</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Pick a unique username and display name to represent you across communities and discussions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              required
              maxLength={50}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span>Username</span>
              <span className="text-[10px] text-muted-foreground font-mono">lowercase, 3-20 chars</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-mono">u/</span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="developer_handle"
                className="pl-8 font-mono"
                required
                minLength={3}
                maxLength={20}
              />
              <div className="absolute right-3 top-2.5 flex items-center">
                {checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {!checking && isValid === true && <Check className="h-4 w-4 text-success" />}
                {!checking && isValid === false && <AlertCircle className="h-4 w-4 text-danger" />}
              </div>
            </div>
            {errorMsg && <p className="text-xs text-danger flex items-center gap-1 mt-1">{errorMsg}</p>}
          </div>

          <Button
            type="submit"
            disabled={!isValid || checking || submitting || !displayName.trim()}
            className="w-full bg-accent hover:bg-accent/90 text-white shadow-glow-sm"
          >
            {submitting ? "Saving handle..." : "Continue to Curia"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
