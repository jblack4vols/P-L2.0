import { createBrowserClient } from '@supabase/ssr'

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type AuditEntry = {
  id: string
  user_id: string
  action_type: string
  resource_type: string
  year: number | null
  location: string | null
  change_summary: string
  created_at: string
}

export async function logAudit(
  userId: string,
  action: string,
  resource: string,
  opts: { year?: number; location?: string; summary?: string } = {}
) {
  try {
    const supabase = getSupabase()
    await supabase.from('audit_log').insert({
      user_id: userId,
      action_type: action,
      resource_type: resource,
      year: opts.year ?? null,
      location: opts.location ?? null,
      change_summary: opts.summary ?? '',
    })
  } catch (e) {
    console.error('Audit log error:', e)
  }
}

export async function fetchAuditLog(
  userId: string,
  filters: { actionType?: string; startDate?: string; endDate?: string; limit?: number } = {}
): Promise<AuditEntry[]> {
  try {
    const supabase = getSupabase()
    let query = supabase
      .from('audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(filters.limit || 100)

    if (filters.actionType && filters.actionType !== 'all') {
      query = query.eq('action_type', filters.actionType)
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate + 'T23:59:59')
    }

    const { data, error } = await query
    if (error) { console.error('Fetch audit log error:', error); return [] }
    return (data || []) as AuditEntry[]
  } catch (e) {
    console.error('Fetch audit log failed:', e)
    return []
  }
}
