import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://kslwypkobielrvdsulhm.supabase.co";

const SUPABASE_KEY = "sb_publishable_giGnmWFmoAN0D6pAnmj3sw_czBnGuUZ";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);