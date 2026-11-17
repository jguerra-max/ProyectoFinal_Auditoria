import { NextResponse } from 'next/server'
import { getContext } from '@/lib/auth'

export async function GET() {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Inicie sesión' }, { status: 401 })
  const tables = ['organizations','audits','controls','audit_controls','evaluations','evidences','findings','finding_evidences','recommendations','audit_reports','audit_activity'] as const
  async function allRows(table: typeof tables[number]) {
    const output: Record<string,unknown>[] = []
    for (let from=0;;from+=1000) {
      const result=table==='audit_reports'
        ? await ctx!.supabase.from('audit_reports').select('id,audit_id,generated_by,report_version,generated_at').order('id').range(from,from+999)
        : await ctx!.supabase.from(table).select('*').order('id').range(from,from+999)
      if(result.error) return { data:null, error:result.error }
      output.push(...(result.data||[]))
      if((result.data||[]).length<1000) return { data:output, error:null }
    }
  }
  const results = await Promise.all(tables.map(allRows))
  const data: Record<string, unknown> = {}
  for (let i=0; i<tables.length; i++) {
    if (results[i].error) return NextResponse.json({ error: results[i].error!.message }, { status: 500 })
    data[tables[i]] = results[i].data
  }
  // Only administrators can inspect other profiles; ordinary users see their own.
  const profiles = await ctx.supabase.from('profiles').select('id,full_name,email,role')
  data.profiles = profiles.data || []
  return NextResponse.json({ data, user: { id: ctx.user.id, email: ctx.user.email, role: ctx.profile?.role, name: ctx.profile?.full_name } })
}
