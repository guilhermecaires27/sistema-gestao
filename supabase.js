
import { createClient } from
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL =
    'https://lwolxehupdfzqqadfyxj.supabase.co';

const SUPABASE_KEY =
    'sb_publishable_GQ09RYrlwQ8VFYPFfyTQGg_xUgpV34T';

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
