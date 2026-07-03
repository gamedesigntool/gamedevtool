type SupabaseEnvironmentConfig = {
  url: string;
  publishableKey: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabaseEnvironment: SupabaseEnvironmentConfig = {
  url: supabaseUrl,
  publishableKey: supabasePublishableKey,
};

export const isSupabaseConfigured =
  supabaseEnvironment.url.trim().length > 0 &&
  supabaseEnvironment.publishableKey.trim().length > 0;
