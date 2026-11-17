import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") || "/";

  // Prevent open redirect vulnerabilities by strictly ensuring relative paths
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  // Check for upstream OAuth provider errors (e.g. user denied consent, configuration error)
  const oauthError = requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error");
  if (oauthError) {
    console.error("[Supabase Auth Callback] OAuth provider error:", oauthError);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(oauthError)}`, requestUrl.origin)
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
    console.error("[Supabase Auth Callback] Exchange code for session error:", error.message, error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
    );
  }

  // If code is missing and no explicit error was provided
  console.warn("[Supabase Auth Callback] Missing authorization code in query parameters.");
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent("Authentication code missing from provider callback")}`, requestUrl.origin)
  );
}
