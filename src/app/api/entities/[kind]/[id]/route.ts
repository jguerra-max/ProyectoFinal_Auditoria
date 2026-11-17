import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getContext, canWrite, isAdmin } from '@/lib/auth'
import { resources, validate, type Resource } from '@/lib/schemas'
import { storageAdmin } from '@/lib/supabase/admin'

type Params = { params: Promise<{ kind: string, id: string }> }
async function context(params: Params) {
  const { kind, id } = await params.params
  const ctx = await getContext()
  if (!ctx) return { error: NextResponse.json({ error: 'Inicie sesión' }, { status: 401 }) }
  if (!resources.includes(kind as Resource)) return { error: NextResponse.json({ error: 'Módulo desconocido' }, { status: 404 }) }
  if (kind === 'controls' ? !isAdmin(ctx.profile?.role) : !canWrite(ctx.profile?.role)) return { error: NextResponse.json({ error: 'Sin permiso' }, { status: 403 }) }
  return { ctx, kind: kind as Resource, id }
}

export async function PATCH(request: NextRequest, params: Params) {
  const access = await context(params)
  if ('error' in access) return access.error
  const { ctx, kind, id } = access
  try {
    const old = await ctx.supabase.from(kind).select('*').eq('id', id).single()
    if (old.error) return NextResponse.json({ error: old.error.message }, { status: 404 })
    const changes = await request.json()
    if (kind === 'evidences' && ('file_path' in changes || 'mime_type' in changes || 'file_size' in changes)) return NextResponse.json({ error: 'El archivo adjunto no puede modificarse en este formulario' }, { status: 400 })
    const merged = { ...old.data, ...changes }
    const input = validate(kind, merged, true)
    if (kind === 'audits' && String(input.end_date) < String(input.start_date)) return NextResponse.json({ error: 'La fecha final debe ser posterior a la inicial' }, { status: 400 })
    if (kind === 'findings') delete input.evidence_ids
    if (kind === 'controls') {
      const result = await ctx.supabase.rpc('version_control', { p_control: id, p_data: input })
      if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })
      return NextResponse.json({ data: result.data })
    }
    const result = await ctx.supabase.from(kind).update(input).eq('id', id).select('*').single()
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })
    if (kind === 'findings' && Array.isArray(changes.evidence_ids)) {
      const links = await ctx.supabase.rpc('set_finding_evidences', { p_finding: id, p_ids: changes.evidence_ids })
      if (links.error) return NextResponse.json({ error: links.error.message }, { status: 400 })
    }
    return NextResponse.json({ data: result.data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof ZodError ? error.issues.map(x => x.message).join('; ') : 'Solicitud inválida' }, { status: 400 })
  }
}

export async function DELETE(_request: NextRequest, params: Params) {
  const access = await context(params)
  if ('error' in access) return access.error
  const { ctx, kind, id } = access
  if (kind === 'controls') return NextResponse.json({ error: 'Desactive o versione el control para conservar el historial' }, { status: 400 })
  if (kind === 'audits') {
    const { data: files } = await ctx.supabase.from('evidences').select('file_path').eq('audit_id', id).not('file_path','is',null)
    const paths = (files || []).map(x => x.file_path).filter(Boolean) as string[]
    let storage: ReturnType<typeof storageAdmin> | null = null
    if (paths.length) { try { storage=storageAdmin() } catch(error) { return NextResponse.json({error:(error as Error).message},{status:503}) } }
    const result = await ctx.supabase.rpc('delete_audit_tree', { p_audit: id })
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })
    const removed=storage ? await storage.remove(paths) : null
    return NextResponse.json({ ok: true, warning: removed?.error?.message || null })
  }
  let filePath:string|null=null
  if (kind === 'evidences') { const row = await ctx.supabase.from('evidences').select('file_path').eq('id',id).single(); filePath=row.data?.file_path||null }
  let storage: ReturnType<typeof storageAdmin> | null = null
  if (filePath) { try { storage=storageAdmin() } catch(error) { return NextResponse.json({error:(error as Error).message},{status:503}) } }
  const result = await ctx.supabase.from(kind).delete().eq('id', id)
  const removed=!result.error&&storage&&filePath?await storage.remove([filePath]):null
  return result.error ? NextResponse.json({ error: result.error.message }, { status: 400 }) : NextResponse.json({ ok: true, warning: removed?.error?.message || null })
}
