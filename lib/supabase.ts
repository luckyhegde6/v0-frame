const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Helper function to check if Supabase is properly configured
export const isSupabaseAvailable = () => {
  return !!(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'))
}

// Only create client if both environment variables are properly set
let supabaseInstance: any = null

try {
  if (isSupabaseAvailable()) {
    const { createClient } = require('@supabase/supabase-js')
    supabaseInstance = createClient(supabaseUrl, supabaseKey)
  }
} catch (error) {
  // Silently fail - Supabase not available in this environment
  supabaseInstance = null
}

export const supabase = supabaseInstance
