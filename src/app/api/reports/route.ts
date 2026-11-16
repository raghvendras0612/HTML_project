import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import * as z from "zod";

const createReportSchema = z.object({
  post_id: z.string().uuid().optional().nullable(),
  comment_id: z.string().uuid().optional().nullable(),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(500),
});

export async function POST(request: Request) {
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

    const body = await request.json();
    const validated = createReportSchema.parse(body);

    if (!validated.post_id && !validated.comment_id) {
      return NextResponse.json(
        { error: "Either post_id or comment_id must be provided" },
        { status: 400 }
      );
    }

    const { data: report, error } = await admin
      .from("reports")
      .insert({
        reporter_id: user.id,
        post_id: validated.post_id || null,
        comment_id: validated.comment_id || null,
        reason: validated.reason,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Report submission failed" },
      { status: 500 }
    );
  }
}
