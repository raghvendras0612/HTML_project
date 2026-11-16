"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/common/user-avatar";
import { EmptyState } from "@/components/common/empty-state";
import { Sparkles, Calendar, Edit3, MessageSquare, FileText, Loader2, Upload } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function UserProfilePage() {
  const params = useParams();
  const rawUsername = params?.username as string;
  const username = decodeURIComponent(rawUsername || "").toLowerCase();
  const { user, profile: authProfile, refreshProfile } = useUser();

  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false);

  // Edit form state
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const isOwnProfile = user && profile && user.id === profile.id;

  React.useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", username)
            .maybeSingle();

          if (data) {
            setProfile(data as Profile);
            setDisplayName(data.display_name || "");
            setBio(data.bio || "");
            setLoading(false);
            return;
          }
        }

        // Fallback to mock profiles
        const mockMatch = Object.values(MOCK_PROFILES).find(
          (p) => p.username.toLowerCase() === username
        );

        if (mockMatch) {
          setProfile(mockMatch as Profile);
          setDisplayName(mockMatch.display_name || "");
          setBio(mockMatch.bio || "");
        } else if (authProfile && authProfile.username.toLowerCase() === username) {
          setProfile(authProfile);
          setDisplayName(authProfile.display_name || "");
          setBio(authProfile.bio || "");
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      loadProfile();
    }
  }, [username, authProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar image must be under 5 MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    try {
      let avatarUrl = profile.avatar_url;

      if (avatarFile && isSupabaseConfigured()) {
        const supabase = createClient();
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          toast.error(`Upload error: ${uploadError.message}`);
          setSaving(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            display_name: displayName.trim(),
            bio: bio.trim(),
            avatar_url: avatarUrl,
          })
          .eq("id", user.id);

        if (updateError) {
          toast.error(updateError.message);
          setSaving(false);
          return;
        }
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              display_name: displayName.trim(),
              bio: bio.trim(),
              avatar_url: avatarUrl,
            }
          : null
      );

      toast.success("Profile updated successfully!");
      setEditOpen(false);
      await refreshProfile();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="curia-card p-8 text-center bg-surface border-border">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-accent mb-2" />
        <p className="text-xs text-muted-foreground font-mono">Loading user profile...</p>
      </Card>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        title="User not found"
        description={`The user @${username} does not exist or may have been deleted.`}
        actionLabel="Back to Home"
        onAction={() => window.location.assign("/")}
      />
    );
  }

  const joinDate = profile.created_at
    ? format(new Date(profile.created_at), "MMMM yyyy")
    : "Recently";

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="curia-card border-border bg-surface overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-accent/30 via-accent/10 to-surface-raised" />
        <CardContent className="p-6 relative pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-12 sm:-mt-14 mb-4 gap-4">
            <div className="flex items-end gap-3.5">
              <UserAvatar
                src={profile.avatar_url}
                name={profile.display_name || profile.username}
                className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-surface shadow-md"
              />
              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {profile.display_name || profile.username}
                </h1>
                <p className="font-mono text-xs sm:text-sm text-muted-foreground">
                  u/{profile.username}
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 border-border hover:bg-surface-raised text-xs"
              >
                <Edit3 className="h-3.5 w-3.5 text-accent" />
                <span>Edit Profile</span>
              </Button>
            )}
          </div>

          {/* Bio */}
          {profile.bio ? (
            <p className="text-sm text-foreground/90 mt-3 leading-relaxed max-w-xl">
              {profile.bio}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic mt-3">
              No bio provided yet.
            </p>
          )}

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-mono text-accent">
              <Sparkles className="h-3.5 w-3.5 text-accent-glow" />
              <span>{profile.karma} karma</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Joined {joinDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts & Comments Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="bg-surface border border-border w-full justify-start p-1 h-auto">
          <TabsTrigger value="posts" className="flex items-center gap-2 text-xs py-2 px-4">
            <FileText className="h-3.5 w-3.5" />
            <span>Posts</span>
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2 text-xs py-2 px-4">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Comments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="pt-4">
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No posts yet"
            description={`u/${profile.username} hasn't published any posts.`}
          />
        </TabsContent>

        <TabsContent value="comments" className="pt-4">
          <EmptyState
            icon={<MessageSquare className="h-6 w-6" />}
            title="No comments yet"
            description={`u/${profile.username} hasn't shared any comments.`}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      {isOwnProfile && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md bg-surface border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Edit Profile</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update your public profile details and avatar.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              {/* Avatar Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Avatar Image</label>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={avatarPreview || profile.avatar_url}
                    name={displayName || profile.username}
                    size="lg"
                  />
                  <div className="space-y-1 flex-1">
                    <label
                      htmlFor="avatar-file-input"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-raised text-xs text-foreground cursor-pointer hover:border-accent transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5 text-accent" />
                      <span>Choose Image</span>
                    </label>
                    <input
                      id="avatar-file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <p className="text-[10px] text-muted-foreground">PNG, JPG, or WEBP up to 5 MB</p>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  required
                  maxLength={50}
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Bio</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others what you build, research, or discuss..."
                  rows={3}
                  maxLength={250}
                />
                <p className="text-[10px] text-muted-foreground text-right">{bio.length}/250</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving || !displayName.trim()}
                  className="bg-accent hover:bg-accent/90 text-white"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
