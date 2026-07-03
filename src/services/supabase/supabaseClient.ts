import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseEnvironment } from "../../config/environment";

export const supabaseClient: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseEnvironment.url, supabaseEnvironment.publishableKey)
  : null;
