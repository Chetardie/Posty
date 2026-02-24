import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabasePublishableKey } from "@/lib/env";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
