import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Check if moderator
    const { data: memberRow } = await admin
      .from("community_members")
      .select("role")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberRow?.role !== "moderator") {
      return NextResponse.json({ error: "Forbidden — moderator access only" }, { status: 403 });
    }

    const { data: bans, error: banErr } = await admin
      .from("community_bans")
      .select("*")
      .eq("community_id", community.id);

    if (banErr) {
      return NextResponse.json({ error: banErr.message }, { status: 400 });
    }

    const bannedUserIds = (bans || []).map((b) => b.user_id);
    let profMap: Record<string, unknown> = {};
    if (bannedUserIds.length > 0) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, username, display_name")
        .in("id", bannedUserIds);
      if (profs) {
        profMap = profs.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, unknown>);
      }
    }

    const enriched = (bans || []).map((b) => ({
      ...b,
      user: profMap[b.user_id] || null,
    }));

    return NextResponse.json({ bans: enriched });
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

    const { data: memberRow } = await admin
      .from("community_members")
      .select("role")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberRow?.role !== "moderator") {
      return NextResponse.json({ error: "Forbidden — moderator access only" }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, reason = "Violation of community rules" } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const { data: ban, error: banErr } = await admin
      .from("community_bans")
      .upsert(
        {
          community_id: community.id,
          user_id,
          banned_by: user.id,
          reason,
        },
        { onConflict: "community_id,user_id" }
      )
      .select()
      .single();

    if (banErr) {
      return NextResponse.json({ error: banErr.message }, { status: 400 });
    }

    return NextResponse.json({ ban }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to ban user" },
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

    const { data: memberRow } = await admin
      .from("community_members")
      .select("role")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberRow?.role !== "moderator") {
      return NextResponse.json({ error: "Forbidden — moderator access only" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("user_id");

    if (!targetUserId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const { error: delErr } = await admin
      .from("community_bans")
      .delete()
      .eq("community_id", community.id)
      .eq("user_id", targetUserId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, unbanned: targetUserId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to unban user" },
      { status: 500 }
    );
  }
}
