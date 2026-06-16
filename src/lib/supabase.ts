import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://tyuxgbkkptpowdxinzex.supabase.co";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "sb_publishable_498T9qyKwFwCKxdSJkYTDg_do07nAQl";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
