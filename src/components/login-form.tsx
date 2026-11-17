'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
export function LoginForm() {
  const router=useRouter(); const [mode,setMode]=useState<'login'|'register'|'reset'>('login'); const [busy,setBusy]=useState(false)
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState('')
  const [statusMsg,setStatusMsg]=useState<{type:'error'|'success',text:string}|null>(null)

  async function submit(event:React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setStatusMsg(null)
    try {
      const supabase=createClient()
      if(mode==='login') {
        const { data, error } = await supabase.auth.signInWithPassword({email,password})
        if(error) {
          setBusy(false)
          setStatusMsg({type:'error',text:error.message})
          toast.error(error.message)
          return
        }
        if(data.session) {
          window.location.href = '/dashboard'
          return
        }
      }
      if(mode==='register') {
        const { data, error } = await supabase.auth.signUp({email,password,options:{data:{full_name:name}}})
        if(error) {
          setBusy(false)
          setStatusMsg({type:'error',text:error.message})
          toast.error(error.message)
          return
        }
        setBusy(false)
        if(data.session) {
          window.location.href = '/dashboard'
          return
        }
        setMode('login')
        setStatusMsg({type:'success',text:'Cuenta creada exitosamente. Ya puedes iniciar sesión.'})
        toast.success('Cuenta creada exitosamente.')
        return
      }
      if(mode==='reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/auth/callback?next=/reset-password`})
        setBusy(false)
        if(error) {
          setStatusMsg({type:'error',text:error.message})
          toast.error(error.message)
          return
        }
        setStatusMsg({type:'success',text:'Revise su correo para restablecer la contraseña.'})
        toast.success('Revise su correo para restablecer la contraseña.')
      }
    } catch(err: unknown) {
      setBusy(false)
      const msg = err instanceof Error ? err.message : String(err)
      setStatusMsg({type:'error',text:msg})
      toast.error(msg)
    }
  }
  return <form onSubmit={submit} className="space-y-4">
    {statusMsg && (
      <div className={`p-3 text-sm rounded-lg border ${statusMsg.type==='error'?'bg-red-50 text-red-800 border-red-200':'bg-green-50 text-green-800 border-green-200'}`}>
        {statusMsg.text}
      </div>
    )}
    {mode==='register'&&<label className="block"><span className="field-label">Nombre completo</span><Input value={name} onChange={e=>setName(e.target.value)} required /></label>}
    <label className="block"><span className="field-label">Correo electrónico</span><Input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
    {mode!=='reset'&&<label className="block"><span className="field-label">Contraseña</span><Input type="password" minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} required /></label>}
    <Button type="submit" className="w-full h-11" disabled={busy}>{busy?'Espere…':mode==='login'?'Iniciar sesión':mode==='register'?'Crear cuenta':'Enviar enlace'}</Button>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-primary"><button type="button" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Crear cuenta':'Volver al inicio'}</button>{mode==='login'&&<button type="button" onClick={()=>setMode('reset')}>¿Olvidó su contraseña?</button>}</div>
  </form>
}
