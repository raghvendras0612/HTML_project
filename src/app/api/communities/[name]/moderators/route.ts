import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { name } = await params;
  const communityName = decodeURIComponent(name).toLowerCase();

  try {
    const admin = createAdminClient();
    const { data: community } = await admin
      .from("communities")
      .select("id")
      .ilike("name", communityName)
      .maybeSingle();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const { data: modRows } = await admin
      .from("community_members")
      .select("user_id, role, joined_at")
      .eq("community_id", community.id)
      .eq("role", "moderator");

    const modUserIds = (modRows || []).map((m) => m.user_id);
    let profileMap: Record<string, unknown> = {};
    if (modUserIds.length > 0) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", modUserIds);
      if (profs) {
        profileMap = profs.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, unknown>);
      }
    }

    const moderators = (modRows || []).map((m) => ({
      ...m,
      user: profileMap[m.user_id] || null,
    }));

    return NextResponse.json({ moderators });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { name } = await params;
  const communityName = decodeURIComponent(name).toLowerCase();

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

    const { data: community } = await admin
      .from("communities")
      .select("id")
      .ilike("name", communityName)
      .maybeSingle();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Caller must be moderator
    const { data: callerRow } = await admin
      .from("community_members")
      .select("role")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (callerRow?.role !== "moderator") {
      return NextResponse.json({ error: "Forbidden — moderator access only" }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, username } = body;

    let targetUserId = user_id;
    if (!targetUserId && username) {
      const { data: prof } = await admin
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .maybeSingle();
      targetUserId = prof?.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Add or promote to moderator
    const { error: upsertErr } = await admin
      .from("community_members")
      .upsert(
        {
          community_id: community.id,
          user_id: targetUserId,
          role: "moderator",
        },
        { onConflict: "community_id,user_id" }
      );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user_id: targetUserId, role: "moderator" }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add moderator" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { name } = await params;
  const communityName = decodeURIComponent(name).toLowerCase();

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

    const { data: community } = await admin
      .from("communities")
      .select("id")
      .ilike("name", communityName)
      .maybeSingle();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Caller must be moderator
    const { data: callerRow } = await admin
      .from("community_members")
      .select("role")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (callerRow?.role !== "moderator") {
      return NextResponse.json({ error: "Forbidden — moderator access only" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("user_id");

    if (!targetUserId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Count current moderators
    const { count: modCount } = await admin
      .from("community_members")
      .select("user_id", { count: "exact", head: true })
      .eq("community_id", community.id)
      .eq("role", "moderator");

    // Enforce Test 18: The last remaining moderator cannot be removed!
    if ((modCount || 0) <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last remaining moderator from the community" },
        { status: 400 }
      );
    }

    // Demote to member
    const { error: demoteErr } = await admin
      .from("community_members")
      .update({ role: "member" })
      .eq("community_id", community.id)
      .eq("user_id", targetUserId);

    if (demoteErr) {
      return NextResponse.json({ error: demoteErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, demoted: targetUserId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove moderator" },
      { status: 500 }
    );
  }
}
