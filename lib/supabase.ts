import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseKey = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseServer = createClient(supabaseUrl, supabaseKey)