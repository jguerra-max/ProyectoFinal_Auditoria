'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
export function PasswordReset() { const [password,setPassword]=useState(''); const router=useRouter()
 async function submit(e:React.FormEvent){e.preventDefault();const {error}=await createClient().auth.updateUser({password});if(error)toast.error(error.message);else{toast.success('Contraseña actualizada');router.push('/dashboard')}}
 return <form onSubmit={submit} className="space-y-4"><Input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Mínimo 8 caracteres"/><Button className="w-full">Guardar contraseña</Button></form> }
