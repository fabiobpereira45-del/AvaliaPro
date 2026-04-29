import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    const supabaseUrl = 'https://kekuwxhqrzvrgbjiqyue.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtla3V3eGhxcnp2cmdiamlxeXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTkyMTAsImV4cCI6MjA5Mjk5NTIxMH0.U183t2yRk83igrSqpaNFZdMoXsw_X7yidWIzKm7nfBg'

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
