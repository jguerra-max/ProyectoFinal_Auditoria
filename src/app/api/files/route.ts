import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getContext, canWrite } from '@/lib/auth'
import { schemas } from '@/lib/schemas'
import { storageAdmin } from '@/lib/supabase/admin'

const allowed: Record<string,string> = { pdf:'application/pdf', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', txt:'text/plain' }
function signatureValid(ext: string, bytes: Buffer) {
  if (ext==='pdf') return bytes.subarray(0,5).toString()==='%PDF-'
  if (ext==='png') return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
  if (ext==='jpg'||ext==='jpeg') return bytes[0]===255 && bytes[1]===216 && bytes[2]===255
  return !bytes.includes(0)
}
export async function POST(request: NextRequest) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Inicie sesión' }, { status: 401 })
  if (!canWrite(ctx.profile?.role)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Seleccione un archivo' }, { status: 400 })
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!allowed[ext] || allowed[ext] !== file.type || file.size > 4*1024*1024 || file.size === 0) return NextResponse.json({ error: 'Solo PDF, PNG, JPG o TXT de hasta 4 MB' }, { status: 400 })
  const bytes = Buffer.from(await file.arrayBuffer())
  if (!signatureValid(ext,bytes)) return NextResponse.json({ error: 'El contenido no coincide con el tipo del archivo' }, { status: 400 })
  const input = {
    audit_id: String(form.get('audit_id')||''), control_id: String(form.get('control_id')||''),
    name: String(form.get('name')||file.name), description: String(form.get('description')||''),
    evidence_type: String(form.get('evidence_type')||'DOCUMENTO'), source: String(form.get('source')||''),
    obtained_at: String(form.get('obtained_at')||new Date().toISOString().slice(0,10)),
    file_path: `${String(form.get('audit_id'))}/${randomUUID()}.${ext}`,
    mime_type: file.type, file_size: file.size, is_simulated: form.get('is_simulated')==='true',
  }
  const parsed = schemas.evidences.safeParse(input)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map(x=>x.message).join('; ') }, { status: 400 })
  let storage: ReturnType<typeof storageAdmin>
  try { storage=storageAdmin() } catch(error) { return NextResponse.json({ error:(error as Error).message },{status:503}) }
  const uploaded = await storage.upload(input.file_path, bytes, { contentType: file.type, upsert: false })
  if (uploaded.error) return NextResponse.json({ error: uploaded.error.message }, { status: 400 })
  const inserted = await ctx.supabase.from('evidences').insert({ ...parsed.data, registered_by: ctx.user.id }).select('*').single()
  if (inserted.error) {
    await storage.remove([input.file_path])
    return NextResponse.json({ error: inserted.error.message }, { status: 400 })
  }
  return NextResponse.json({ data: inserted.data }, { status: 201 })
}
export async function GET(request: NextRequest) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Inicie sesión' }, { status: 401 })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el identificador' }, { status: 400 })
  const row = await ctx.supabase.from('evidences').select('file_path').eq('id',id).single()
  if (!row.data?.file_path) return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })
  let storage: ReturnType<typeof storageAdmin>
  try { storage=storageAdmin() } catch(error) { return NextResponse.json({ error:(error as Error).message },{status:503}) }
  const signed = await storage.createSignedUrl(row.data.file_path, 60)
  if (signed.error) return NextResponse.json({ error: signed.error.message }, { status: 400 })
  return NextResponse.json({ url: signed.data.signedUrl })
}
