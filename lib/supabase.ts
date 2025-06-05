import { createClient } from "@supabase/supabase-js"

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a dummy client for development if credentials are missing
let supabase: ReturnType<typeof createClient>

// Only create the client if we're in a browser environment and have the required credentials
if (typeof window !== "undefined") {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase credentials missing. Using mock client. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
    )

    // Create a mock client with dummy methods for development
    supabase = {
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    } as any
  } else {
    // Create the real client if we have credentials
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
} else {
  // Server-side placeholder
  supabase = {} as any
}

// Export the client
export { supabase }

// Types for TypeScript
export interface Atualizacao {
  id?: number
  titulo: string
  descricao: string
  autor: string
  data: string
  created_at?: string
}
