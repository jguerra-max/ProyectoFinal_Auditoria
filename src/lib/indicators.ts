export type Status = 'IMPLEMENTADO' | 'PARCIALMENTE_IMPLEMENTADO' | 'NO_IMPLEMENTADO' | 'NO_APLICABLE'
export function indicators(rows: { status: Status }[]) {
  const implemented = rows.filter(x => x.status === 'IMPLEMENTADO').length
  const partial = rows.filter(x => x.status === 'PARCIALMENTE_IMPLEMENTADO').length
  const missing = rows.filter(x => x.status === 'NO_IMPLEMENTADO').length
  const notApplicable = rows.filter(x => x.status === 'NO_APLICABLE').length
  const applicable = implemented + partial + missing
  return {
    implemented, partial, missing, notApplicable, applicable, evaluated: rows.length,
    implementation: applicable ? Math.round(implemented / applicable * 1000) / 10 : null,
    partialPercent: applicable ? Math.round(partial / applicable * 1000) / 10 : null,
    missingPercent: applicable ? Math.round(missing / applicable * 1000) / 10 : null,
  }
}
