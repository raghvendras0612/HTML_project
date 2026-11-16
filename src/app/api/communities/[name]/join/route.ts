import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ name: string }>;
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
      return NextResponse.json({ error: "Unauthorized — please log in" }, { status: 401 });
    }

    // 1. Resolve community
    const { data: community, error: commError } = await admin
      .from("communities")
      .select("id, member_count")
      .ilike("name", communityName)
      .single();

    if (commError || !community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // 2. Check if user is banned
    const { data: ban } = await admin
      .from("community_bans")
      .select("created_at")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (ban) {
      return NextResponse.json(
        { error: "You are banned from this community and cannot join." },
        { status: 403 }
      );
    }

    // 3. Check existing membership
    const { data: existingMember } = await admin
      .from("community_members")
      .select("role")
      .eq("community_id", community.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      // Leave community
      const { error: deleteError } = await admin
        .from("community_members")
        .delete()
        .eq("community_id", community.id)
        .eq("user_id", user.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 });
      }

      const newCount = Math.max(0, (community.member_count || 1) - 1);
      await admin.from("communities").update({ member_count: newCount }).eq("id", community.id);

      return NextResponse.json({
        joined: false,
        member_count: newCount,
      });
    } else {
      // Join community
      const { error: insertError } = await admin
        .from("community_members")
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: "member",
        });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }

      const newCount = (community.member_count || 0) + 1;
      await admin.from("communities").update({ member_count: newCount }).eq("id", community.id);

      return NextResponse.json({
        joined: true,
        member_count: newCount,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
