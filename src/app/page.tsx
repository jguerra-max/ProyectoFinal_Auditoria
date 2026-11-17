import { redirect } from 'next/navigation'
export default function Home() { redirect(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '/dashboard' : '/setup') }
