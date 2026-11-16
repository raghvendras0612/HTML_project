"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCommunitySchema,
  type CreateCommunityInput,
} from "@/lib/validations/community-and-post";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  Loader2,
  Hash,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface CommunityFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function CommunityForm({ onSuccess, className }: CommunityFormProps) {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Live uniqueness check state
  const [isCheckingName, setIsCheckingName] = React.useState(false);
  const [nameAvailable, setNameAvailable] = React.useState<boolean | null>(null);
  const [nameCheckMessage, setNameCheckMessage] = React.useState<string>("");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCommunityInput>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
      title: "",
      description: "",
      rules: [
        { title: "Be civil and constructive", body: "Respect other developers and avoid personal attacks." },
      ],
      icon_url: null,
      banner_url: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rules",
  });

  const nameValue = watch("name");

  // Debounced live name uniqueness check
  React.useEffect(() => {
    if (!nameValue || nameValue.length < 3) {
      setNameAvailable(null);
      setNameCheckMessage("");
      return;
    }

    if (!/^[a-z0-9_]{3,21}$/.test(nameValue)) {
      setNameAvailable(false);
      setNameCheckMessage("Only lowercase letters, numbers, and underscores (3-21 chars)");
      return;
    }

    setIsCheckingName(true);
    setNameAvailable(null);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/communities/check-name?name=${encodeURIComponent(nameValue)}`);
        const data = await res.json();
        setNameAvailable(data.available);
        setNameCheckMessage(data.message || (data.available ? "Community name is available" : "Name is already taken"));
      } catch {
        setNameAvailable(null);
      } finally {
        setIsCheckingName(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [nameValue]);

  const onSubmit = async (values: CreateCommunityInput) => {
    if (!user) {
      openAuthModal("signin");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create community");
      }

      toast.success(`Community c/${values.name} created successfully!`);
      if (onSuccess) onSuccess();
      router.push(`/c/${values.name}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
      toast.error(err instanceof Error ? err.message : "Failed to create community");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${className || ""}`}>
      {errorMsg && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Community Name Handle */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>Community Name</span>
          <span className="font-mono text-[10px] text-muted-foreground">3-21 lowercase chars</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 font-mono text-xs text-muted-foreground select-none">
            c/
          </span>
          <Input
            {...register("name")}
            onChange={(e) => {
              const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
              setValue("name", cleaned, { shouldValidate: true });
            }}
            placeholder="e.g. distributed_systems"
            className="pl-8 font-mono text-xs bg-surface-raised border-border"
            autoCapitalize="none"
            autoCorrect="off"
            maxLength={21}
          />
          <div className="absolute right-3 top-2.5">
            {isCheckingName && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
            {!isCheckingName && nameAvailable === true && (
              <CheckCircle2 className="h-4 w-4 text-success" />
            )}
            {!isCheckingName && nameAvailable === false && (
              <AlertCircle className="h-4 w-4 text-danger" />
            )}
          </div>
        </div>
        {nameCheckMessage && (
          <p
            className={`text-[11px] font-mono ${
              nameAvailable ? "text-success" : "text-danger"
            }`}
          >
            {nameCheckMessage}
          </p>
        )}
        {errors.name && (
          <p className="text-[11px] text-danger font-mono">{errors.name.message}</p>
        )}
      </div>

      {/* Community Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Display Title
        </label>
        <Input
          {...register("title")}
          placeholder="e.g. Distributed Systems & Consensus"
          className="text-xs bg-surface-raised border-border"
          maxLength={100}
        />
        {errors.title && (
          <p className="text-[11px] text-danger font-mono">{errors.title.message}</p>
        )}
      </div>

      {/* Community Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Description
        </label>
        <Textarea
          {...register("description")}
          placeholder="What is this community about? Who should join?"
          className="text-xs bg-surface-raised border-border resize-none h-20"
          maxLength={500}
        />
        {errors.description && (
          <p className="text-[11px] text-danger font-mono">{errors.description.message}</p>
        )}
      </div>

      {/* Rules Editor */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-accent" />
            <span>Community Rules ({fields.length}/10)</span>
          </label>
          {fields.length < 10 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ title: "", body: "" })}
              className="h-7 text-xs gap-1 border-border"
            >
              <Plus className="h-3 w-3" />
              <span>Add Rule</span>
            </Button>
          )}
        </div>

        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="p-2.5 rounded-lg border border-border bg-surface-raised/40 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground font-semibold">
                  {idx + 1}.
                </span>
                <Input
                  {...register(`rules.${idx}.title` as const)}
                  placeholder={`Rule ${idx + 1} Title`}
                  className="h-7 text-xs bg-surface border-border flex-1"
                  maxLength={100}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(idx)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <Input
                {...register(`rules.${idx}.body` as const)}
                placeholder="Optional explanation / guidelines"
                className="h-7 text-xs bg-surface border-border text-muted-foreground"
                maxLength={500}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || nameAvailable === false || isCheckingName}
          className="w-full bg-accent hover:bg-accent/90 text-white shadow-glow-sm h-9 text-xs"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Creating Community...
            </>
          ) : (
            "Create Community"
          )}
        </Button>
      </div>
    </form>
  );
}
