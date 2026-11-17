import { redirect } from 'next/navigation'
import { getContext } from '@/lib/auth'
import { WorkspaceProvider } from '@/components/workspace'
import { AppShell } from '@/components/app-shell'
export default async function PrivateLayout({children}:{children:React.ReactNode}) {
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)redirect('/setup')
 const ctx=await getContext();if(!ctx)redirect('/login')
 return <WorkspaceProvider initialUser={{id:ctx.user.id,email:ctx.user.email,role:ctx.profile?.role,name:ctx.profile?.full_name}}><AppShell>{children}</AppShell></WorkspaceProvider>
}
