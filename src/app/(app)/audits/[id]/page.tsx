import { AuditDetail } from '@/components/audit-detail'
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <AuditDetail id={id}/>}
