"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";
import type { Community } from "@/types/database.types";
import {
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Hash,
  Eye,
  PenLine,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { PageSkeleton } from "@/components/common/page-skeleton";
import { SuggestedCommunitiesChips } from "@/components/post/suggested-communities-chips";
import { ModerationWarningDialog } from "@/components/post/moderation-warning-dialog";

function SubmitFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, openAuthModal } = useAuth();

  const preselectedParam = searchParams.get("c") || "";

  // Available communities and user's joined state
  const [communities, setCommunities] = React.useState<Community[]>(MOCK_COMMUNITIES);
  const [selectedCommunity, setSelectedCommunity] = React.useState<Community | null>(null);
  const [isMember, setIsMember] = React.useState<boolean>(true);
  const [isBanned, setIsBanned] = React.useState<boolean>(false);
  const [isCheckingMembership, setIsCheckingMembership] = React.useState(false);

  // Form Fields
  const [postType, setPostType] = React.useState<"text" | "image" | "link">("text");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [markdownTab, setMarkdownTab] = React.useState<"write" | "preview">("write");

  // Image Upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Moderation state
  const [isWarnDialogOpen, setIsWarnDialogOpen] = React.useState(false);
  const [warnReason, setWarnReason] = React.useState("");

  // 1. Fetch communities list
  React.useEffect(() => {
    let isMounted = true;
    async function loadCommunities() {
      try {
        const res = await fetch("/api/communities?limit=100");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.communities && data.communities.length > 0) {
            setCommunities(data.communities);
          }
        }
      } catch {
        // Fallback to MOCK_COMMUNITIES
      }
    }
    loadCommunities();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Select community from preselected param or default
  React.useEffect(() => {
    if (communities.length === 0) return;
    if (preselectedParam) {
      const match = communities.find(
        (c) => c.name.toLowerCase() === preselectedParam.toLowerCase()
      );
      if (match) {
        setSelectedCommunity(match);
        return;
      }
    }
    if (!selectedCommunity) {
      setSelectedCommunity(communities[0]);
    }
  }, [preselectedParam, communities, selectedCommunity]);

  // 3. Check membership & ban status for selected community
  React.useEffect(() => {
    let isMounted = true;
    if (!selectedCommunity) return;

    async function checkStatus() {
      if (!user) {
        setIsMember(false);
        setIsBanned(false);
        return;
      }
      if (!selectedCommunity?.name) return;
      setIsCheckingMembership(true);
      try {
        const res = await fetch(`/api/communities/${selectedCommunity.name}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsMember(Boolean(data.isMember));
            setIsBanned(Boolean(data.isBanned));
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsCheckingMembership(false);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [selectedCommunity, user]);

  // Join Community Handler
  const handleJoinCommunity = async () => {
    if (!user) {
      openAuthModal("signin");
      return;
    }
    if (!selectedCommunity) return;

    try {
      const res = await fetch(`/api/communities/${selectedCommunity.name}/join`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setIsMember(data.joined);
        toast.success(`Joined c/${selectedCommunity.name}! You can now post here.`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to join community");
      }
    } catch {
      toast.error("Network error joining community");
    }
  };

  // Handle Image File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 5MB limit");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Supported formats: JPEG, PNG, WEBP, GIF");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    setErrorMsg(null);
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  // Extract domain for link preview
  const domainPreview = React.useMemo(() => {
    if (!url.trim()) return null;
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }, [url]);

  // Handle Post Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openAuthModal("signin");
      return;
    }

    if (!selectedCommunity) {
      setErrorMsg("Please select a community");
      return;
    }

    if (isBanned) {
      setErrorMsg(`You are banned from posting in c/${selectedCommunity.name}`);
      return;
    }

    if (!isMember) {
      setErrorMsg(`You must join c/${selectedCommunity.name} before posting`);
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Title is required");
      return;
    }

    if (title.length > 300) {
      setErrorMsg("Title cannot exceed 300 characters");
      return;
    }

    if (postType === "link") {
      if (!url.trim()) {
        setErrorMsg("Please enter a valid link URL");
        return;
      }
      try {
        new URL(url);
      } catch {
        setErrorMsg("Please enter a valid HTTP or HTTPS URL");
        return;
      }
    }

    if (postType === "image" && !selectedFile) {
      setErrorMsg("Please select an image to upload");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // AI Moderation Pre-check (Requirement 6, 7, 8)
    try {
      const textToModerate = `${title.trim()}\n\n${body.trim()}`.trim();
      const modRes = await fetch("/api/ai/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToModerate }),
      });

      if (modRes.ok) {
        const modData = await modRes.json();
        if (modData.verdict === "block") {
          setErrorMsg(
            `Post blocked by content safety policy: ${modData.reason || "Violates community guidelines."}`
          );
          setIsSubmitting(false);
          return;
        }
        if (modData.verdict === "warn") {
          setWarnReason(
            modData.reason || "This content may be perceived as hostile or insulting."
          );
          setIsWarnDialogOpen(true);
          setIsSubmitting(false);
          return;
        }
      }
    } catch {
      // Fail open if moderate endpoint fails
    }

    await executePublish("allow");
  };

  const executePublish = async (verdict: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let imagePath: string | null = null;

      // 1. Upload image if post type is image
      if (postType === "image" && selectedFile) {
        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload image");
        }
        imagePath = uploadData.path;
      }

      // 2. Submit post to /api/posts
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community_id: selectedCommunity?.id,
          type: postType,
          title: title.trim(),
          body: postType === "text" ? body.trim() || null : null,
          url: postType === "link" ? url.trim() : null,
          image_path: imagePath,
          moderation_verdict: verdict,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      toast.success("Post published!");
      router.push(`/c/${selectedCommunity?.name}/post/${data.post.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to publish post");
      toast.error(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto py-2">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Create a Post
        </h1>
        <Button variant="outline" size="sm" asChild className="text-xs border-border">
          <Link href="/communities">Browse Communities</Link>
        </Button>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Community Selector & Join-Gate Notice */}
      <Card className="curia-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              Choose a Community
            </label>
            <div className="relative">
              <select
                value={selectedCommunity?.id || ""}
                onChange={(e) => {
                  const match = communities.find((c) => c.id === e.target.value);
                  if (match) setSelectedCommunity(match);
                }}
                className="h-9 px-3 pr-8 rounded-lg bg-surface-raised border border-border text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    c/{c.name} — {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Join-Gate Status Banner */}
          {selectedCommunity && !isCheckingMembership && (
            <div className="flex items-center gap-2">
              {isBanned ? (
                <div className="flex items-center gap-1.5 text-xs text-danger font-mono bg-danger/10 px-2.5 py-1.5 rounded-lg border border-danger/20">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Banned from posting</span>
                </div>
              ) : isMember ? (
                <Badge variant="outline" className="text-xs font-mono text-success border-success/30 bg-success/10 py-1">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Joined Member
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={handleJoinCommunity}
                  className="h-8 text-xs bg-accent hover:bg-accent/90 text-white shadow-glow-sm"
                >
                  Join c/{selectedCommunity.name} to Post
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Join Warning Prompt */}
        {selectedCommunity && !isMember && !isBanned && !isCheckingMembership && (
          <p className="text-xs text-muted-foreground bg-accent/5 p-2 rounded-lg border border-accent/20">
            ✦ Only joined members can publish in <strong>c/{selectedCommunity.name}</strong>. Click &quot;Join&quot; above to unlock posting.
          </p>
        )}

        {/* AI Suggested Communities Chips (Requirement 10, 12, 13) */}
        <SuggestedCommunitiesChips
          title={title}
          body={body}
          selectedCommunityName={selectedCommunity?.name}
          onSelectCommunity={(name) => {
            const match = communities.find(
              (c) => c.name.toLowerCase() === name.toLowerCase()
            );
            if (match) {
              setSelectedCommunity(match);
              toast.success(`Selected c/${match.name}`);
            }
          }}
        />
      </Card>

      {/* Main Post Editor Card */}
      <Card className="curia-card overflow-hidden">
        <Tabs
          value={postType}
          onValueChange={(val) => setPostType(val as "text" | "image" | "link")}
          className="w-full"
        >
          {/* Post Type Tabs */}
          <div className="border-b border-border bg-surface-raised/40 px-3">
            <TabsList className="bg-transparent h-12 gap-2">
              <TabsTrigger
                value="text"
                className="data-[state=active]:bg-surface data-[state=active]:text-accent text-xs gap-2 py-2"
              >
                <FileText className="h-4 w-4" />
                <span>Text</span>
              </TabsTrigger>
              <TabsTrigger
                value="image"
                className="data-[state=active]:bg-surface data-[state=active]:text-accent text-xs gap-2 py-2"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Image</span>
              </TabsTrigger>
              <TabsTrigger
                value="link"
                className="data-[state=active]:bg-surface data-[state=active]:text-accent text-xs gap-2 py-2"
              >
                <LinkIcon className="h-4 w-4" />
                <span>Link</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {/* Title with Length Counter (300 max) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                <label>Title</label>
                <span
                  className={`font-mono text-[11px] ${
                    title.length > 280
                      ? "text-danger font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {title.length}/300
                </span>
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="An interesting, descriptive title..."
                maxLength={300}
                className="bg-surface border-border text-sm font-medium"
              />
            </div>

            {/* Tab: Text Post with Write/Preview toggle */}
            <TabsContent value="text" className="space-y-2 mt-0">
              <div className="flex items-center justify-between pb-1">
                <label className="text-xs font-semibold text-foreground">
                  Body (Markdown supported)
                </label>
                <div className="flex rounded-md border border-border p-0.5 bg-surface-raised">
                  <button
                    type="button"
                    onClick={() => setMarkdownTab("write")}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors ${
                      markdownTab === "write"
                        ? "bg-surface text-accent font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <PenLine className="h-3 w-3" />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarkdownTab("preview")}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors ${
                      markdownTab === "preview"
                        ? "bg-surface text-accent font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>

              {markdownTab === "write" ? (
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share details, code snippets, benchmarks, or insights... Markdown is fully rendered."
                  className="min-h-56 bg-surface border-border font-sans text-xs sm:text-sm leading-relaxed"
                />
              ) : (
                <div className="min-h-56 p-4 rounded-md border border-border bg-surface-raised/20 prose prose-invert prose-sm max-w-none">
                  {body.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml={true}>
                      {body}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground italic text-xs">
                      Nothing to preview yet. Switch back to Write mode to draft your post.
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Tab: Image Post */}
            <TabsContent value="image" className="space-y-3 mt-0">
              <label className="text-xs font-semibold text-foreground block">
                Upload Image (PNG, JPG, WEBP, GIF — max 5MB)
              </label>

              {imagePreviewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border bg-black/40 max-h-80 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreviewUrl}
                    alt="Upload preview"
                    className="max-h-80 w-full object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeSelectedImage}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white h-8 w-8 p-0 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border hover:border-accent/50 rounded-xl cursor-pointer bg-surface hover:bg-surface-raised/40 transition-colors">
                  <Upload className="h-8 w-8 text-accent mb-2" />
                  <p className="text-xs font-medium text-foreground">
                    Drag and drop or click to upload
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Images are stored in the secure post-images bucket
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </TabsContent>

            {/* Tab: Link Post */}
            <TabsContent value="link" className="space-y-3 mt-0">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Target URL
                </label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="bg-surface border-border text-xs font-mono"
                />
              </div>

              {domainPreview && (
                <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Domain detected:</span>
                  <Badge variant="cyan" className="font-mono text-xs">
                    {domainPreview}
                  </Badge>
                </div>
              )}
            </TabsContent>

            {/* Submit Action Bar */}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-xs text-muted-foreground"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || isUploadingImage || isBanned || !isMember}
                className="bg-accent hover:bg-accent/90 text-white shadow-glow-sm text-xs px-6 h-9"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    {isUploadingImage ? "Uploading Image..." : "Publishing..."}
                  </>
                ) : (
                  "Post Discussion"
                )}
              </Button>
            </div>
          </form>
        </Tabs>
      </Card>

      {/* Moderation Warning Confirmation Dialog (Requirement 7) */}
      <ModerationWarningDialog
        open={isWarnDialogOpen}
        reason={warnReason}
        onEdit={() => setIsWarnDialogOpen(false)}
        onConfirm={() => {
          setIsWarnDialogOpen(false);
          executePublish("warn");
        }}
      />
    </div>
  );
}

export default function SubmitPage() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <SubmitFormContent />
    </React.Suspense>
  );
}
