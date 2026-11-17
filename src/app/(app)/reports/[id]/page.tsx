import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getContext } from '@/lib/auth'
import { PrintAction } from '@/components/print-action'
import { ReportDocument } from '@/components/report-document'
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const ctx=await getContext();if(!ctx)notFound();const result=await ctx.supabase.from('audit_reports').select('*').eq('id',id).single();if(result.error)notFound();return <div><div className="no-print flex flex-wrap gap-2 justify-between mb-5"><Link className="text-sm text-primary" href="/reports">← Volver a informes</Link><div className="flex gap-2"><PrintAction/><a className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm" href={`/api/reports/${id}/pdf`} download={`auditsys-informe-v${result.data.report_version}.pdf`}>Descargar PDF</a></div></div><ReportDocument report={result.data}/></div>}
