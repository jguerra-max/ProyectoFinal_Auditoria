import { indicators, type Status } from '@/lib/indicators'
import { createClient } from '@/lib/supabase/server'

export async function makeSnapshot(supabase: Awaited<ReturnType<typeof createClient>>, auditId: string) {
  const audit = await supabase.from('audits').select('*').eq('id', auditId).single()
  if (audit.error) throw new Error(audit.error.message)
  const [organization, responsible, links, evaluations, evidences, findings, recommendations, findingEvidences, controls] = await Promise.all([
    supabase.from('organizations').select('*').eq('id',audit.data.organization_id).single(),
    supabase.from('profiles').select('full_name,email').eq('id',audit.data.responsible_id).single(),
    supabase.from('audit_controls').select('*').eq('audit_id',auditId),
    supabase.from('evaluations').select('*').eq('audit_id',auditId),
    supabase.from('evidences').select('*').eq('audit_id',auditId),
    supabase.from('findings').select('*').eq('audit_id',auditId),
    supabase.from('recommendations').select('*'),
    supabase.from('finding_evidences').select('*'),
    supabase.from('controls').select('*'),
  ])
  for (const result of [organization,responsible,links,evaluations,evidences,findings,recommendations,findingEvidences,controls]) if (result.error) throw new Error(result.error.message)
  const controlIds = new Set((links.data||[]).map(x => x.control_id))
  const findingIds = new Set((findings.data||[]).map(x => x.id))
  const evidenceIds = new Set((evidences.data||[]).map(x => x.id))
  return {
    audit: audit.data, organization: organization.data, responsible: responsible.data,
    controls: (controls.data||[]).filter(x => controlIds.has(x.id)),
    evaluations: evaluations.data||[], evidences: evidences.data||[], findings: findings.data||[],
    recommendations: (recommendations.data||[]).filter(x => findingIds.has(x.finding_id)),
    findingEvidences: (findingEvidences.data||[]).filter(x => findingIds.has(x.finding_id) && evidenceIds.has(x.evidence_id)),
    indicators: indicators((evaluations.data||[]) as { status: Status }[]),
    methodology: {
      references: ['ISO 19011:2018 (edición elegida para este ejercicio)','ISO/IEC 27001:2022','ISO/IEC 27002:2022'],
      procedure: 'Revisión de criterios definidos en cada control, registro de observaciones, evidencias y validación humana de hallazgos.',
    },
    disclaimer: 'Documento de apoyo académico. No certifica cumplimiento ni sustituye el juicio profesional del auditor.',
  }
}
