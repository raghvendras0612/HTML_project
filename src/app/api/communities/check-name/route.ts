import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawName = searchParams.get("name")?.trim().toLowerCase();

  if (!rawName) {
    return NextResponse.json({ valid: false, available: false, error: "Name is required" }, { status: 400 });
  }

  // Regex validation: 3-21 chars, lowercase, letters/numbers/underscore
  const nameRegex = /^[a-z0-9_]{3,21}$/;
  if (!nameRegex.test(rawName)) {
    return NextResponse.json(
      { valid: false, available: false, error: "Must be 3-21 lowercase characters (letters, numbers, underscores only)" },
      { status: 200 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("communities")
      .select("id")
      .eq("name", rawName)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ valid: false, available: false, error: error.message }, { status: 500 });
    }

    if (data) {
      return NextResponse.json({ valid: false, available: false, error: "Community name is already taken" }, { status: 200 });
    }

    return NextResponse.json({ valid: true, available: true, error: null }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { valid: false, available: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
