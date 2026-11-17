import { NextResponse } from 'next/server'
import { getContext } from '@/lib/auth'
import { reportPdf } from '@/lib/pdf'
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const ctx=await getContext();if(!ctx)return NextResponse.json({error:'Inicie sesión'},{status:401});const result=await ctx.supabase.from('audit_reports').select('*').eq('id',id).single();if(result.error)return NextResponse.json({error:'Informe no encontrado'},{status:404});const bytes=await reportPdf(result.data);return new Response(Buffer.from(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="auditsys-informe-v${result.data.report_version}.pdf"`,'Cache-Control':'private, no-store'}})}
