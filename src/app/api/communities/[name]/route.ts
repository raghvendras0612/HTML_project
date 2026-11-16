import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";

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
    } = await supabase.auth.getUser();

    // 1. Fetch community details
    const { data: community, error } = await admin
      .from("communities")
      .select("*")
      .ilike("name", communityName)
      .maybeSingle();

    if (error || !community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // 2. Fetch moderators
    const { data: modRows } = await admin
      .from("community_members")
      .select("user_id, role")
      .eq("community_id", community.id)
      .eq("role", "moderator");

    const modUserIds = (modRows || []).map((m) => m.user_id);
    let moderators: { id: string; username: string | null; display_name: string | null; avatar_url: string | null }[] = [];
    if (modUserIds.length > 0) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", modUserIds);
      moderators = profs || [];
    }

    // 3. Check current user membership & ban status
    let isMember = false;
    let isModerator = false;
    let isBanned = false;

    if (user) {
      const { data: memberRow } = await admin
        .from("community_members")
        .select("role")
        .eq("community_id", community.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberRow) {
        isMember = true;
        isModerator = memberRow.role === "moderator";
      }

      const { data: banRow } = await admin
        .from("community_bans")
        .select("created_at")
        .eq("community_id", community.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (banRow) {
        isBanned = true;
      }
    }

    return NextResponse.json({
      community,
      moderators,
      isMember,
      isModerator,
      isBanned,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
