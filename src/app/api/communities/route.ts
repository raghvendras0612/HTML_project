import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createCommunitySchema } from "@/lib/validations/community-and-post";
import { MOCK_COMMUNITIES } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase();
  const sort = searchParams.get("sort") || "members"; // members | newest
  const joined = searchParams.get("joined") === "true";
  const trending = searchParams.get("trending") === "true";
  const limit = trending ? 5 : parseInt(searchParams.get("limit") || "50", 10);

  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let dbQuery = admin.from("communities").select("*");

    if (joined) {
      if (!user) {
        return NextResponse.json({ communities: [] });
      }
      const { data: memberships } = await admin
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      if (!memberships || memberships.length === 0) {
        return NextResponse.json({ communities: [] });
      }

      const commIds = memberships.map((m) => m.community_id);
      dbQuery = dbQuery.in("id", commIds);
    }

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (sort === "newest") {
      dbQuery = dbQuery.order("created_at", { ascending: false });
    } else {
      dbQuery = dbQuery.order("member_count", { ascending: false });
    }

    const { data, error } = await dbQuery.limit(limit);

    if (error || !data) {
      return NextResponse.json({ communities: [] });
    }

    return NextResponse.json({ communities: data });
  } catch {
    return NextResponse.json({ communities: [] });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized — please log in" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createCommunitySchema.parse(body);

    // Insert community using admin client to prevent trigger RLS deadlocks while preserving strict auth & input validation
    const admin = createAdminClient();
    const { data: community, error: communityError } = await admin
      .from("communities")
      .insert({
        name: validated.name.toLowerCase(),
        title: validated.title,
        description: validated.description || "",
        rules: validated.rules || [],
        icon_url: validated.icon_url || null,
        banner_url: validated.banner_url || null,
        creator_id: user.id,
        member_count: 1,
      })
      .select()
      .single();

    if (communityError || !community) {
      if (communityError?.code === "23505") {
        return NextResponse.json(
          { error: `Community c/${validated.name} already exists` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: communityError?.message || "Failed to create community" },
        { status: 400 }
      );
    }

    // Automatically add creator as moderator & member
    await admin.from("community_members").upsert({
      community_id: community.id,
      user_id: user.id,
      role: "moderator",
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "errors" in err && Array.isArray((err as { errors: { message: string }[] }).errors)) {
      return NextResponse.json(
        { error: (err as { errors: { message: string }[] }).errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
