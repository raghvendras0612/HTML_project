"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Loader2, Hash } from "lucide-react";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";

const communitySchema = z.object({
  name: z
    .string()
    .min(3, "Community name must be at least 3 characters")
    .max(21, "Community name must be at most 21 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Community name can only contain lowercase letters, numbers, and underscores"
    ),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

type CommunityFormValues = z.infer<typeof communitySchema>;

interface CreateCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCommunityModal({
  open,
  onOpenChange,
}: CreateCommunityModalProps) {
  const router = useRouter();
  const { user, profile, isConfigured } = useAuth();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CommunityFormValues>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      name: "",
      title: "",
      description: "",
    },
  });

  const rawName = watch("name");

  const onSubmit = async (values: CommunityFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (!isConfigured) {
        // Mock creation in demo mode
        const exists = MOCK_COMMUNITIES.some(
          (c) => c.name.toLowerCase() === values.name.toLowerCase()
        );
        if (exists) {
          setErrorMsg(`Community c/${values.name} already exists.`);
          setIsSubmitting(false);
          return;
        }

        const newCommunity = {
          id: `comm-${Date.now()}`,
          name: values.name.toLowerCase(),
          title: values.title,
          description: values.description || "",
          icon_url: null,
          banner_url: null,
          creator_id: profile?.id || "user-1",
          members_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        MOCK_COMMUNITIES.unshift(newCommunity);
        reset();
        onOpenChange(false);
        router.push(`/c/${newCommunity.name}`);
        return;
      }

      // Live Supabase API call
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create community");
      }

      reset();
      onOpenChange(false);
      router.push(`/c/${values.name}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface border-border p-6 shadow-glow">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 border border-accent/40 text-accent font-mono text-sm">
              <Hash className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Create a Community
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Communities are self-moderated discussion spaces for specific subjects.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Community Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Community Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-mono text-muted-foreground">
                c/
              </span>
              <Input
                className="pl-7 font-mono text-xs"
                placeholder="ai_research"
                {...register("name", {
                  onChange: (e) => {
                    setValue("name", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                  },
                })}
                disabled={isSubmitting}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Names cannot be changed. 3-21 characters, lowercase letters, numbers, and underscores.
            </p>
            {errors.name && (
              <p className="text-[11px] text-danger">{errors.name.message}</p>
            )}
          </div>

          {/* Community Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Community Title / Display Name
            </label>
            <Input
              placeholder="AI Research & Engineering"
              {...register("title")}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-[11px] text-danger">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Description & Purpose
            </label>
            <Textarea
              placeholder="What is this community about? Who is it for?"
              rows={3}
              {...register("description")}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-[11px] text-danger">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="shadow-glow-sm"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Community
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
