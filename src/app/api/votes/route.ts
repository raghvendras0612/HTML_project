import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MOCK_POSTS, MOCK_COMMENTS } from "@/lib/mock-data";
import * as z from "zod";
import type { VoteType, TargetType } from "@/types/database.types";

const voteSchema = z.object({
  target_id: z.string(),
  target_type: z.enum(["post", "comment"]),
  vote_type: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { target_id, target_type, vote_type } = voteSchema.parse(body);

    if (!isSupabaseConfigured()) {
      // Mock voting in demo mode
      if (target_type === "post") {
        const post = MOCK_POSTS.find((p) => p.id === target_id);
        if (post) {
          if (post.user_vote === vote_type) {
            // Cancel vote
            post.score -= vote_type;
            if (vote_type === 1) post.upvotes_count = Math.max(0, post.upvotes_count - 1);
            else post.downvotes_count = Math.max(0, post.downvotes_count - 1);
            post.user_vote = null;
            return NextResponse.json({ action: "cancelled", currentScore: post.score });
          } else if (post.user_vote) {
            // Switch vote (+1 to -1 or vice versa)
            const delta = vote_type - post.user_vote;
            post.score += delta;
            if (vote_type === 1) {
              post.upvotes_count += 1;
              post.downvotes_count = Math.max(0, post.downvotes_count - 1);
            } else {
              post.downvotes_count += 1;
              post.upvotes_count = Math.max(0, post.upvotes_count - 1);
            }
            post.user_vote = vote_type;
            return NextResponse.json({ action: "switched", currentScore: post.score });
          } else {
            // New vote
            post.score += vote_type;
            if (vote_type === 1) post.upvotes_count += 1;
            else post.downvotes_count += 1;
            post.user_vote = vote_type;
            return NextResponse.json({ action: "voted", currentScore: post.score });
          }
        }
      }
      return NextResponse.json({ success: true });
    }

    // Live Supabase voting
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existingVote } = await supabase
      .from("votes")
      .select("*")
      .eq("user_id", user.id)
      .eq("target_type", target_type)
      .eq("target_id", target_id)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Cancel vote
        await supabase
          .from("votes")
          .delete()
          .eq("id", existingVote.id);
        return NextResponse.json({ action: "cancelled", user_vote: null });
      } else {
        // Switch vote
        await supabase
          .from("votes")
          .update({ vote_type })
          .eq("id", existingVote.id);
        return NextResponse.json({ action: "switched", user_vote: vote_type });
      }
    } else {
      // New vote
      await supabase.from("votes").insert({
        user_id: user.id,
        target_type,
        target_id,
        vote_type,
      });
      return NextResponse.json({ action: "voted", user_vote: vote_type });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Vote error" },
      { status: 500 }
    );
  }
}
