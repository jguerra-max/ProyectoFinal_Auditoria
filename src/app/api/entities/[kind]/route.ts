import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getContext, canWrite, isAdmin } from '@/lib/auth'
import { resources, validate, type Resource } from '@/lib/schemas'

export async function POST(request: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Inicie sesión' }, { status: 401 })
  if (!resources.includes(kind as Resource)) return NextResponse.json({ error: 'Módulo desconocido' }, { status: 404 })
  if (kind === 'controls' ? !isAdmin(ctx.profile?.role) : !canWrite(ctx.profile?.role)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  try {
    const body = await request.json()
    const input = validate(kind as Resource, body)
    if (kind === 'audits' && String(input.end_date) < String(input.start_date)) return NextResponse.json({ error: 'La fecha final debe ser posterior a la inicial' }, { status: 400 })
    if (kind === 'audits' && input.status !== 'PLANIFICADA') return NextResponse.json({ error: 'Una auditoría nueva comienza en estado Planificada' }, { status: 400 })
    if (kind === 'evidences' && input.file_path) return NextResponse.json({ error: 'Los archivos se registran mediante la ruta de carga segura' }, { status: 400 })
    if (kind === 'findings') delete input.evidence_ids
    const controlled: Record<string, unknown> = { ...input }
    if (kind === 'audits') controlled.responsible_id = ctx.user.id
    if (kind === 'evaluations') controlled.evaluator_id = ctx.user.id
    if (kind === 'evidences') controlled.registered_by = ctx.user.id
    if (kind === 'findings') controlled.responsible_id = ctx.user.id
    const evidenceIds = kind === 'findings' ? body.evidence_ids as string[] : []
    const inserted = await ctx.supabase.from(kind).insert(controlled).select('*').single()
    if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 400 })
    if (kind === 'audits') {
      const { data: controls } = await ctx.supabase.from('controls').select('id').eq('active', true)
      if (controls?.length) {
        const links=await ctx.supabase.from('audit_controls').insert(controls.map(x => ({ audit_id: inserted.data.id, control_id: x.id })))
        if(links.error){await ctx.supabase.from('audits').delete().eq('id',inserted.data.id);return NextResponse.json({error:links.error.message},{status:400})}
      }
    }
    if (kind === 'findings' && evidenceIds?.length) {
      const result = await ctx.supabase.from('finding_evidences').insert(evidenceIds.map(evidence_id => ({ finding_id: inserted.data.id, evidence_id })))
      if (result.error) { await ctx.supabase.from('findings').delete().eq('id',inserted.data.id);return NextResponse.json({ error: result.error.message }, { status: 400 }) }
    }
    return NextResponse.json({ data: inserted.data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof ZodError ? error.issues.map(x => x.message).join('; ') : 'Solicitud inválida' }, { status: 400 })
  }
}
