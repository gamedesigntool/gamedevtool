type SupabaseEnvironmentConfig = {
  url: string;
  anonKey: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabaseEnvironment: SupabaseEnvironmentConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

export const isSupabaseConfigured =
  supabaseEnvironment.url.trim().length > 0 &&
  supabaseEnvironment.anonKey.trim().length > 0;
