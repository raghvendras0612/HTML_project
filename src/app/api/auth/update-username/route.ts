import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-z0-9_]{3,20}$/, "Only lowercase letters, numbers, and underscores allowed"),
  display_name: z.string().min(1, "Display name is required").max(50),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { username, display_name } = validated.data;

    // Check if username already taken by another user
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username,
        display_name,
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, username, display_name });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
