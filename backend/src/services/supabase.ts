import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Bindings } from '../types'

export function getSupabase(env: Bindings): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
}
