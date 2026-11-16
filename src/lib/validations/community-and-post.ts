import { z } from "zod";

export const communityRuleSchema = z.object({
  title: z.string().min(1, "Rule title cannot be empty").max(100, "Max 100 characters"),
  body: z.string().max(500, "Max 500 characters").default(""),
});

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(21, "Name must be at most 21 characters")
    .regex(/^[a-z0-9_]{3,21}$/, "Only lowercase letters, numbers, and underscores allowed"),
  title: z.string().min(1, "Title is required").max(100, "Max 100 characters"),
  description: z.string().max(500, "Max 500 characters").default(""),
  rules: z.array(communityRuleSchema).max(10, "Maximum 10 rules allowed").default([]),
  icon_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;

export const createPostSchema = z.object({
  community_id: z.string().uuid("Invalid community"),
  type: z.enum(["text", "image", "link"]),
  title: z
    .string()
    .min(1, "Title is required")
    .max(300, "Title cannot exceed 300 characters"),
  body: z.string().max(40000, "Body cannot exceed 40,000 characters").nullable().optional(),
  url: z.string().url("Please provide a valid URL").nullable().optional(),
  image_path: z.string().nullable().optional(),
  moderation_verdict: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
