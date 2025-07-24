import { Database as DatabaseAutoGen } from "./supabase.autogen";

export type { DatabaseAutoGen as Database }

export type Sample = DatabaseAutoGen['public']['Tables']['samples']['Row']