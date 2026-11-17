import { NextResponse } from 'next/server'
import { getContext, canWrite } from '@/lib/auth'
import { makeSnapshot } from '@/lib/reports'

export async function POST() {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Inicie sesión' }, { status: 401 })
  if (!canWrite(ctx.profile?.role)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  const seeded = await ctx.supabase.rpc('seed_demo')
  if (seeded.error) return NextResponse.json({ error: seeded.error.message }, { status: 400 })
  const snapshot = await makeSnapshot(ctx.supabase, seeded.data)
  const report = await ctx.supabase.from('audit_reports').insert({ audit_id: seeded.data, generated_by: ctx.user.id, report_version: 1, conclusions: 'Escenario simulado: los controles seleccionados muestran tres brechas que requieren tratamiento. Esta conclusión se ofrece solo para la demostración académica y debe ser validada por un auditor.', snapshot_data: snapshot })
  if (report.error) return NextResponse.json({ error: report.error.message }, { status: 400 })
  return NextResponse.json({ audit_id: seeded.data }, { status: 201 })
}
