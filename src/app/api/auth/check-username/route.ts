import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUsername = searchParams.get("username")?.trim().toLowerCase();

  if (!rawUsername) {
    return NextResponse.json({ valid: false, error: "Username is required" }, { status: 400 });
  }

  // Regex validation: 3-20 chars, lowercase, letters/numbers/underscore
  const usernameRegex = /^[a-z0-9_]{3,20}$/;
  if (!usernameRegex.test(rawUsername)) {
    return NextResponse.json(
      { valid: false, error: "Must be 3-20 lowercase characters (letters, numbers, underscores only)" },
      { status: 200 }
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const query = supabase
      .from("profiles")
      .select("id")
      .eq("username", rawUsername);

    if (user) {
      query.neq("id", user.id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
    }

    if (data) {
      return NextResponse.json({ valid: false, error: "Username is already taken" }, { status: 200 });
    }

    return NextResponse.json({ valid: true, error: null }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
