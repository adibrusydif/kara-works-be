import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// Debug: Log what we're getting
console.log('Environment check:', {
    hasUrl: !!process.env.SUPABASE_URL,
    urlLength: process.env.SUPABASE_URL?.length || 0,
    urlPreview: process.env.SUPABASE_URL?.substring(0, 30) || 'NOT SET',
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    anonKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
    anonKeyPreview: process.env.SUPABASE_ANON_KEY?.substring(0, 20) || 'NOT SET',
    anonKeyStartsWith: process.env.SUPABASE_ANON_KEY?.startsWith('eyJ') ? '✓ Correct JWT format' : '✗ Wrong format'
  })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || supabaseUrl === '') {
  throw new Error(
    `Missing SUPABASE_URL environment variable.\n` +
    `Current value: "${supabaseUrl}"\n` +
    `Make sure your .env file exists and contains: SUPABASE_URL=https://bhvwunwerkmvqlippyuh.supabase.co`
  )
}

if (!supabaseAnonKey || supabaseAnonKey === '') {
  throw new Error(
    `Missing SUPABASE_ANON_KEY environment variable.\n` +
    `Make sure your .env file exists and contains your Supabase anon key.`
  )
}

// Client for client-side operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

// Admin client
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false
    }
  }
)