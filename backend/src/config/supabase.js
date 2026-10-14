import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.MONGO_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ [Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables. Database operations may fail until configured.");
}

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : {
        from: (table) => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env") }),
                    maybeSingle: () => Promise.resolve({ data: null, error: new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env") }),
                    order: () => Promise.resolve({ data: [], error: new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env") }),
                }),
                order: () => Promise.resolve({ data: [], error: new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env") })
            }),
            insert: () => Promise.resolve({ error: new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env") }),
            update: () => ({
                eq: () => Promise.resolve({ error: new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env") })
            })
        })
    };

