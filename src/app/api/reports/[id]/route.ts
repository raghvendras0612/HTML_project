import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
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

    // Fetch report to find target
    const { data: report, error: reportErr } = await admin
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (reportErr || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Determine community_id
    let communityId: string | null = null;
    if (report.post_id) {
      const { data: commPost } = await admin
        .from("posts")
        .select("community_id")
        .eq("id", report.post_id)
        .maybeSingle();
      communityId = commPost?.community_id || null;
    } else if (report.comment_id) {
      const { data: commComment } = await admin
        .from("comments")
        .select("post_id")
        .eq("id", report.comment_id)
        .maybeSingle();
      if (commComment?.post_id) {
        const { data: commPost } = await admin
          .from("posts")
          .select("community_id")
          .eq("id", commComment.post_id)
          .maybeSingle();
        communityId = commPost?.community_id || null;
      }
    }

    // Check if user is moderator
    if (communityId) {
      const { data: membership } = await admin
        .from("community_members")
        .select("role")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership?.role !== "moderator") {
        return NextResponse.json({ error: "Moderator permissions required" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { status = "resolved", action } = body;

    // If action is remove: mark target post or comment as removed
    if (action === "remove") {
      if (report.post_id) {
        await admin
          .from("posts")
          .update({ is_removed: true, removed_by: user.id })
          .eq("id", report.post_id);
      } else if (report.comment_id) {
        await admin
          .from("comments")
          .update({ is_removed: true })
          .eq("id", report.comment_id);
      }
    }

    const { data: updatedReport, error: updateErr } = await admin
      .from("reports")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ report: updatedReport });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update report" },
      { status: 500 }
    );
  }
}
