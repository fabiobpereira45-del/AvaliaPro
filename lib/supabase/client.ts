import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: any = null

export function createClient() {
  if (!supabaseInstance) {
    // Bypassing process.env completely for the public vars to avoid string injection 'undefined' bugs on Vercel
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kekuwxhqrzvrgbjiqyue.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtla3V3eGhxcnp2cmdiamlxeXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTkyMTAsImV4cCI6MjA5Mjk5NTIxMH0.U183t2yRk83igrSqpaNFZdMoXsw_X7yidWIzKm7nfBg'
    
    supabaseInstance = createBrowserClient(
      supabaseUrl,
      supabaseKey
    )
  }
  return supabaseInstance
}
