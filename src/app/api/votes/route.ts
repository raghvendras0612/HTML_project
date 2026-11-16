import { NextResponse } from "next/server";
import { createClient, createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { MOCK_POSTS, MOCK_COMMENTS } from "@/lib/mock-data";
import * as z from "zod";

const voteSchema = z.object({
  target_id: z.string().uuid("Invalid target ID"),
  target_type: z.enum(["post", "comment"]),
  vote_type: z.union([z.literal(1), z.literal(-1), z.literal(0)]).optional(),
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { target_id, target_type, vote_type, value } = voteSchema.parse(body);
    const requestedVote = vote_type !== undefined ? vote_type : (value !== undefined ? value : 1);

    // Check existing vote to support client toggle
    let finalValue = requestedVote;
    const voteTargetCol = target_type === "post" ? "post_id" : "comment_id";
    const { data: existingVote } = await admin
      .from("votes")
      .select("value")
      .eq("user_id", user.id)
      .eq(voteTargetCol, target_id)
      .maybeSingle();

    if (existingVote && existingVote.value === requestedVote) {
      // User tapped the same arrow again -> toggle off (value = 0)
      finalValue = 0;
    }

    const oldValue = existingVote ? (existingVote.value || 0) : 0;
    const delta = finalValue - oldValue;

    if (finalValue === 0) {
      if (existingVote) {
        await admin
          .from("votes")
          .delete()
          .eq("user_id", user.id)
          .eq(voteTargetCol, target_id);
      }
    } else {
      if (existingVote) {
        await admin
          .from("votes")
          .update({ value: finalValue })
          .eq("user_id", user.id)
          .eq(voteTargetCol, target_id);
      } else {
        await admin
          .from("votes")
          .insert({
            user_id: user.id,
            post_id: target_type === "post" ? target_id : null,
            comment_id: target_type === "comment" ? target_id : null,
            value: finalValue as 1 | -1,
          });
      }
    }

    // Calculate actual score from the database table to guarantee 100% consistency with votes rows
    let currentScore = 0;
    if (target_type === "post") {
      const { data: allVotes } = await admin
        .from("votes")
        .select("value")
        .eq("post_id", target_id);

      currentScore = (allVotes || []).reduce((sum, v) => sum + (v.value || 0), 0);

      const { data: post } = await admin
        .from("posts")
        .select("author_id")
        .eq("id", target_id)
        .single();

      if (post) {
        const epochSeconds = Math.floor(Date.now() / 1000);
        const order = Math.log10(Math.max(Math.abs(currentScore), 1));
        const sign = currentScore > 0 ? 1 : currentScore < 0 ? -1 : 0;
        const hotRank = parseFloat((sign * order + epochSeconds / 45000).toFixed(7));

        await admin
          .from("posts")
          .update({ score: currentScore, hot_rank: hotRank })
          .eq("id", target_id);

        if (post.author_id) {
          // Compute author total karma from sum of votes received on all posts and comments
          const { data: authorPosts } = await admin
            .from("posts")
            .select("id")
            .eq("author_id", post.author_id);

          const postIds = (authorPosts || []).map((p) => p.id);
          let postKarma = 0;
          if (postIds.length > 0) {
            const { data: pVotes } = await admin
              .from("votes")
              .select("value")
              .in("post_id", postIds);
            postKarma = (pVotes || []).reduce((sum, v) => sum + (v.value || 0), 0);
          }

          const { data: authorComments } = await admin
            .from("comments")
            .select("id")
            .eq("author_id", post.author_id);

          const commentIds = (authorComments || []).map((c) => c.id);
          let commentKarma = 0;
          if (commentIds.length > 0) {
            const { data: cVotes } = await admin
              .from("votes")
              .select("value")
              .in("comment_id", commentIds);
            commentKarma = (cVotes || []).reduce((sum, v) => sum + (v.value || 0), 0);
          }

          await admin
            .from("profiles")
            .update({ karma: postKarma + commentKarma })
            .eq("id", post.author_id);
        }
      }
    } else {
      const { data: allVotes } = await admin
        .from("votes")
        .select("value")
        .eq("comment_id", target_id);

      currentScore = (allVotes || []).reduce((sum, v) => sum + (v.value || 0), 0);

      const { data: comment } = await admin
        .from("comments")
        .select("author_id")
        .eq("id", target_id)
        .single();

      if (comment) {
        await admin
          .from("comments")
          .update({ score: currentScore })
          .eq("id", target_id);

        if (comment.author_id) {
          const { data: authorPosts } = await admin
            .from("posts")
            .select("id")
            .eq("author_id", comment.author_id);

          const postIds = (authorPosts || []).map((p) => p.id);
          let postKarma = 0;
          if (postIds.length > 0) {
            const { data: pVotes } = await admin
              .from("votes")
              .select("value")
              .in("post_id", postIds);
            postKarma = (pVotes || []).reduce((sum, v) => sum + (v.value || 0), 0);
          }

          const { data: authorComments } = await admin
            .from("comments")
            .select("id")
            .eq("author_id", comment.author_id);

          const commentIds = (authorComments || []).map((c) => c.id);
          let commentKarma = 0;
          if (commentIds.length > 0) {
            const { data: cVotes } = await admin
              .from("votes")
              .select("value")
              .in("comment_id", commentIds);
            commentKarma = (cVotes || []).reduce((sum, v) => sum + (v.value || 0), 0);
          }

          await admin
            .from("profiles")
            .update({ karma: postKarma + commentKarma })
            .eq("id", comment.author_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      score: currentScore,
      user_vote: finalValue === 0 ? null : finalValue,
    });
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
