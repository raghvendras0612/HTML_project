import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as z from "zod";
import type { Database } from "@/types/database.types";

const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3)
    .max(21)
    .regex(/^[a-z0-9_]+$/),
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createCommunitySchema.parse(body);

    const communityInsert: Database["public"]["Tables"]["communities"]["Insert"] = {
      name: validated.name.toLowerCase(),
      title: validated.title,
      description: validated.description || "",
      creator_id: user.id,
      members_count: 1,
    };

    // 1. Create Community
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .insert(communityInsert)
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

    const memberInsert: Database["public"]["Tables"]["community_members"]["Insert"] = {
      community_id: community.id,
      user_id: user.id,
    };
    await supabase.from("community_members").insert(memberInsert);

    const modInsert: Database["public"]["Tables"]["community_moderators"]["Insert"] = {
      community_id: community.id,
      user_id: user.id,
      role: "creator",
    };
    await supabase.from("community_moderators").insert(modInsert);

    return NextResponse.json({ community }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
