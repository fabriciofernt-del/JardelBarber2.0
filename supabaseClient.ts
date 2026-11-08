import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jqrtyqsnoskeyfcffjdx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcnR5cXNub3NrZXlmY2ZmamR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjMzOTQsImV4cCI6MjA4NjgzOTM5NH0.lebb9Rx3yed8rxJNTbHluW5nzwsV86iAZHsp5OS0sbo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})