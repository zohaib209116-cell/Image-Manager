import { supabase } from "@/lib/supabase";

export async function secureLogout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (_) {}
}
