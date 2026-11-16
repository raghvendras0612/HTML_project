import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export async function getUser(): Promise<{
  user: User | null;
  profile: Profile | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { user: null, profile: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return { user, profile: (profile as Profile) || null };
  } catch (err) {
    console.error("getUser server helper error:", err);
    return { user: null, profile: null };
  }
}
