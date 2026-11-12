import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jqrtyqsnoskeyfcffjdx.supabase.co'
const supabaseAnonKey = 'sb_publishable_KesfaJN5xYhLuqi5hSMWLA_CJYlxbLI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})