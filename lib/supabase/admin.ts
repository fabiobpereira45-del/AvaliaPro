import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
    const supabaseUrl = 'https://kekuwxhqrzvrgbjiqyue.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtla3V3eGhxcnp2cmdiamlxeXVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQxOTIxMCwiZXhwIjoyMDkyOTk1MjEwfQ.t7I7gSVojc6ybOsdBtbil7rB_lRtiZ18wVbCRhvqmNE'

    return createClient(
        supabaseUrl,
        supabaseKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
