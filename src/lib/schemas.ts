import { z } from 'zod'

const text = z.string().trim().min(1).max(4000)
const short = z.string().trim().min(1).max(200)
const optional = z.string().trim().max(4000).default('')
const id = z.uuid()
const date = z.iso.date()
export const schemas = {
  organizations: z.object({ name: short, description: optional, sector: optional }),
  audits: z.object({ organization_id: id, name: short, description: optional, objective: text, scope: text, start_date: date, end_date: date, audit_type: short, status: z.enum(['PLANIFICADA','EN_EJECUCION','EN_REVISION','FINALIZADA','CANCELADA']) }),
  controls: z.object({ code: z.string().trim().regex(/^\d+\.\d+$/), name: short, description: text, objective: optional, category: z.enum(['ORGANIZACIONAL','PERSONAS','FISICO','TECNOLOGICO']), standard_source: short, evaluation_criteria: text, active: z.boolean() }),
  audit_controls: z.object({ audit_id: id, control_id: id }),
  evaluations: z.object({ audit_id: id, control_id: id, status: z.enum(['IMPLEMENTADO','PARCIALMENTE_IMPLEMENTADO','NO_IMPLEMENTADO','NO_APLICABLE']), observations: optional, justification: optional, evaluated_at: date }).refine(x => x.status !== 'NO_APLICABLE' || x.justification.length > 0, { message: 'Justifique el estado no aplicable', path: ['justification'] }),
  evidences: z.object({ audit_id: id, control_id: id, evaluation_id: id.nullable().optional(), name: short, description: optional, evidence_type: z.enum(['DOCUMENTO','CAPTURA','REGISTRO','ENTREVISTA','OBSERVACION','REFERENCIA','OTRO']), source: optional, obtained_at: date, external_reference: z.union([z.url(), z.string().regex(/^demo:\/\//)]).nullable().optional(), file_path: z.string().nullable().optional(), mime_type: z.string().nullable().optional(), file_size: z.number().int().nonnegative().nullable().optional(), is_simulated: z.boolean().default(false) }).refine(x => !!x.file_path || !!x.external_reference, { message: 'Adjunte un archivo o indique una referencia', path: ['external_reference'] }),
  findings: z.object({ audit_id: id, control_id: id, code: short, title: short, condition: text, criteria: text, cause: optional, effect: optional, severity: z.enum(['CRITICA','ALTA','MEDIA','BAJA']), status: z.enum(['ABIERTO','EN_TRATAMIENTO','EN_REVISION','CERRADO']), evidence_ids: z.array(id).default([]) }),
  recommendations: z.object({ finding_id: id, title: short, description: optional, suggested_action: text, proposed_responsible: optional, target_date: date.nullable().optional(), priority: z.enum(['CRITICA','ALTA','MEDIA','BAJA']), status: z.enum(['PENDIENTE','EN_PROCESO','IMPLEMENTADA','VERIFICADA']) }),
} as const
export type Resource = keyof typeof schemas
export const resources = Object.keys(schemas) as Resource[]
export function validate(kind: Resource, value: unknown, partial = false) {
  const schema = schemas[kind] as z.ZodTypeAny
  if (partial) {
    // Validate an entire edited record after fields are merged in the route.
    return schema.parse(value) as Record<string, unknown>
  }
  return schema.parse(value) as Record<string, unknown>
}
