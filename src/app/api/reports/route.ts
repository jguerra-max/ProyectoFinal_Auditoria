import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getContext, canWrite } from '@/lib/auth'
import { makeSnapshot } from '@/lib/reports'

const schema = z.object({ audit_id: z.uuid(), conclusions: z.string().trim().min(20).max(10000) })
export async function POST(request: NextRequest) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Inicie sesión' }, { status: 401 })
  if (!canWrite(ctx.profile?.role)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map(x => x.message).join('; ') }, { status: 400 })
  try {
    const snapshot = await makeSnapshot(ctx.supabase, parsed.data.audit_id)
    const { data: previous } = await ctx.supabase.from('audit_reports').select('report_version').eq('audit_id',parsed.data.audit_id).order('report_version',{ascending:false}).limit(1)
    const version = (previous?.[0]?.report_version || 0) + 1
    const result = await ctx.supabase.from('audit_reports').insert({ audit_id: parsed.data.audit_id, generated_by: ctx.user.id, report_version: version, conclusions: parsed.data.conclusions, snapshot_data: snapshot }).select('*').single()
    if (result.error) throw new Error(result.error.message)
    return NextResponse.json({ data: result.data }, { status: 201 })
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }) }
}
