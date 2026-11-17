import { createClient } from '@/lib/supabase/server'

export async function getContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return { supabase, user, profile }
}

export function canWrite(role?: string) { return role === 'ADMINISTRADOR' || role === 'AUDITOR' }
export function isAdmin(role?: string) { return role === 'ADMINISTRADOR' }
