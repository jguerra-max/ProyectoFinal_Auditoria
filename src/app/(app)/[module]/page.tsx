import { notFound } from 'next/navigation'
import { ModulePage } from '@/components/module-page'
import { names, type Module } from '@/lib/ui-config'
export default async function Page({params,searchParams}:{params:Promise<{module:string}>,searchParams:Promise<Record<string,string>>}){const {module}=await params;const query=await searchParams;if(!(module in names)||module==='organizations'||module==='audit_controls')notFound();return <ModulePage kind={module as Module} defaults={query}/>}
