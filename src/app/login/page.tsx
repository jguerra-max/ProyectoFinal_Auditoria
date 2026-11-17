import { redirect } from 'next/navigation'
import { getContext } from '@/lib/auth'
import { LoginForm } from '@/components/login-form'
export default async function LoginPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) redirect('/setup')
  if (await getContext()) redirect('/dashboard')
  return <main className="min-h-screen grid lg:grid-cols-[1.05fr_.95fr] bg-white"><div className="hidden lg:flex bg-[#101d35] text-white p-14 flex-col justify-between"><div className="flex items-center gap-3 font-bold text-xl"><span className="w-9 h-9 bg-blue-500 rounded-lg grid place-items-center text-white">A</span>AuditSys Mini</div><div className="max-w-lg"><div className="w-16 h-1 bg-blue-500 mb-8"/><h1 className="text-5xl font-bold tracking-[-.05em] leading-[1.1]">Cada conclusión, respaldada por evidencia.</h1><p className="mt-6 text-[#b9c9e4] text-lg leading-relaxed">Planifique auditorías, evalúe controles y conserve la trazabilidad de los hallazgos en un solo lugar.</p></div><p className="text-sm text-[#8fa4c8]">Herramienta de apoyo académico. No certifica cumplimiento.</p></div><div className="grid items-start lg:place-items-center px-6 pt-20 lg:p-6"><div className="w-full max-w-sm"><div className="lg:hidden font-bold text-xl mb-10">AuditSys Mini</div><h2 className="text-3xl font-bold tracking-tight">Acceda a su espacio</h2><p className="text-muted-foreground mt-2 mb-8">Use su cuenta de auditoría para continuar.</p><LoginForm /></div></div></main>
}
