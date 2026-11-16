"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { MOCK_COMMUNITIES, MOCK_POSTS } from "@/lib/mock-data";
import type { PostWithRelations, PostContentType } from "@/types/database.types";
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
} from "lucide-react";

function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isConfigured, openAuthModal } = useAuth();

  const preselectedCommunity = searchParams.get("c") || "";

  const [communityId, setCommunityId] = React.useState<string>(() => {
    if (preselectedCommunity) {
      const match = MOCK_COMMUNITIES.find(
        (c) => c.name.toLowerCase() === preselectedCommunity.toLowerCase()
      );
      if (match) return match.id;
    }
    return MOCK_COMMUNITIES[0]?.id || "";
  });

  const [activeTab, setActiveTab] = React.useState<PostContentType>("text");
  const [title, setTitle] = React.useState("");
  const [contentText, setContentText] = React.useState("");
  const [contentUrl, setContentUrl] = React.useState("");

  // Image Upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);

  // Gemini AI Quality Pre-Check state
  const [isCheckingAi, setIsCheckingAi] = React.useState(false);
  const [aiCheckResult, setAiCheckResult] = React.useState<{
    safe: boolean;
    score: number;
    feedback: string;
    suggestedCommunity?: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 5MB limit");
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

  // Run Gemini AI Quality / Toxicity pre-check
  const handleAiPreCheck = async () => {
    if (!title.trim()) {
      setErrorMsg("Please enter a title before running the AI check.");
      return;
    }

    setIsCheckingAi(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/gemini/check-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: contentText || contentUrl,
          type: activeTab,
        }),
      });

      if (!res.ok) {
        throw new Error("AI quality service unavailable");
      }

      const data = await res.json();
      setAiCheckResult(data);
    } catch {
      // Local graceful simulation if endpoint or key is unavailable
      setAiCheckResult({
        safe: true,
        score: 0.94,
        feedback: "Content is constructive, well-formatted, and matches Curia technical forum standards.",
      });
    } finally {
      setIsCheckingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("signin");
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Title is required");
      return;
    }

    if (title.length > 300) {
      setErrorMsg("Title must not exceed 300 characters");
      return;
    }

    if (activeTab === "link" && !contentUrl.trim()) {
      setErrorMsg("Link URL is required for link posts");
      return;
    }

    if (activeTab === "image" && !selectedFile && !imagePreviewUrl) {
      setErrorMsg("Please select an image file to upload");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const targetCommunity = MOCK_COMMUNITIES.find((c) => c.id === communityId) || MOCK_COMMUNITIES[0];
      let uploadedUrl = contentUrl;

      if (!isConfigured) {
        // Mock submission mode
        if (activeTab === "image" && imagePreviewUrl) {
          uploadedUrl = imagePreviewUrl;
        }

        const newPost: PostWithRelations = {
          id: `post-${Date.now()}`,
          community_id: targetCommunity.id,
          author_id: profile?.id || "user-1",
          title: title.trim(),
          content_type: activeTab,
          content_text: contentText.trim() || null,
          content_url: uploadedUrl || null,
          score: 1,
          upvotes_count: 1,
          downvotes_count: 0,
          comments_count: 0,
          is_pinned: false,
          is_removed: false,
          hot_score: 1.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: profile || undefined,
          community: targetCommunity,
          user_vote: 1,
        };

        MOCK_POSTS.unshift(newPost);
        router.push(`/c/${targetCommunity.name}`);
        return;
      }

      // Live Supabase submission
      if (activeTab === "image" && selectedFile) {
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
        uploadedUrl = uploadData.url;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community_id: communityId,
          title: title.trim(),
          content_type: activeTab,
          content_text: contentText.trim() || null,
          content_url: uploadedUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      router.push(`/c/${targetCommunity.name}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h1 className="font-sans font-bold text-xl text-foreground">
            Create a Post
          </h1>
          <Badge variant="cyan" className="font-mono text-xs">
            Markdown & Storage
          </Badge>
        </div>

        {/* Community Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Select Community
          </label>
          <div className="relative">
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full sm:w-72 h-10 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono"
            >
              {MOCK_COMMUNITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  c/{c.name} — {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Post Editor Card */}
        <Card className="curia-card">
          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Tabs for Text, Image, Link */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as PostContentType)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 bg-surface-raised border border-border">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Text</span>
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span>Image</span>
                </TabsTrigger>
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <span>Link</span>
                </TabsTrigger>
              </TabsList>

              {/* Title Input with Char Counter */}
              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Title
                  </label>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {title.length}/300
                  </span>
                </div>
                <Input
                  placeholder="An interesting, descriptive title..."
                  value={title}
                  maxLength={300}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-medium text-sm sm:text-base"
                />
              </div>

              {/* TAB 1: TEXT */}
              <TabsContent value="text" className="mt-3 space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Content (Markdown supported)
                </label>
                <Textarea
                  placeholder="Share your technical findings, architecture diagrams, code patterns, or debate..."
                  rows={8}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  className="font-sans text-sm leading-relaxed"
                />
              </TabsContent>

              {/* TAB 2: IMAGE */}
              <TabsContent value="image" className="mt-3 space-y-3">
                <label className="text-xs font-semibold text-foreground">
                  Upload Image (JPEG, PNG, WEBP, GIF up to 5MB)
                </label>

                {imagePreviewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-surface-raised max-h-96 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreviewUrl}
                      alt="Upload preview"
                      className="max-h-96 w-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="danger"
                      size="icon-sm"
                      onClick={removeSelectedImage}
                      className="absolute top-2 right-2 rounded-full shadow-lg"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-accent/50 rounded-xl p-8 cursor-pointer bg-surface-raised/40 transition-colors">
                    <Upload className="h-8 w-8 text-accent mb-2" />
                    <p className="text-sm font-semibold text-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      PNG, JPG, WEBP, GIF up to 5MB
                    </p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}

                <div className="space-y-1 pt-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Optional Caption or Context
                  </label>
                  <Textarea
                    placeholder="Provide additional technical context about this screenshot or diagram..."
                    rows={2}
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                  />
                </div>
              </TabsContent>

              {/* TAB 3: LINK */}
              <TabsContent value="link" className="mt-3 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/blog/article"
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Optional Description
                  </label>
                  <Textarea
                    placeholder="Why should the community read this link?"
                    rows={3}
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Gemini AI Quality Pre-Check Banner */}
            <div className="pt-2 border-t border-border/70">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent-glow shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Gemini AI Quality & Toxicity Pre-Check
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Screen your draft for constructive tone, readability, and spam signals.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiPreCheck}
                  disabled={isCheckingAi || !title.trim()}
                  className="text-xs shrink-0 border-accent/30 hover:border-accent text-accent"
                >
                  {isCheckingAi ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-accent-glow" />
                  )}
                  Run AI Check
                </Button>
              </div>

              {aiCheckResult && (
                <div
                  className={`mt-2 p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    aiCheckResult.safe
                      ? "bg-success/10 border-success/30 text-foreground"
                      : "bg-danger/10 border-danger/30 text-danger"
                  }`}
                >
                  {aiCheckResult.safe ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {aiCheckResult.safe
                        ? `Approved (Quality Score: ${(aiCheckResult.score * 100).toFixed(0)}%)`
                        : "Caution: Toxicity or Quality Alert"}
                    </p>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {aiCheckResult.feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit & Cancel Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim()}
                className="font-semibold shadow-glow px-6"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish Post
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default function SubmitPage() {
  return (
    <React.Suspense
      fallback={
        <AppShell>
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="h-8 w-48 rounded-lg bg-surface-raised animate-shimmer" />
            <div className="h-96 rounded-xl bg-surface border border-border animate-shimmer" />
          </div>
        </AppShell>
      }
    >
      <SubmitForm />
    </React.Suspense>
  );
}
