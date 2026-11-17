'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
export type Row = Record<string, unknown>
export type WorkspaceData = Record<string, Row[]>
type User = { id:string, email?:string, role?:string, name?:string }
type Context = { data:WorkspaceData, user:User, loading:boolean, error:string|null, refresh:()=>Promise<void> }
const WorkspaceContext=createContext<Context|null>(null)
export function WorkspaceProvider({children,initialUser}:{children:React.ReactNode,initialUser:User}) {
 const [data,setData]=useState<WorkspaceData>({});const [user,setUser]=useState(initialUser);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null)
 const refresh=useCallback(async()=>{setLoading(true);try{const response=await fetch('/api/bootstrap',{cache:'no-store'});const body=await response.json();if(!response.ok)throw new Error(body.error||'No se pudieron cargar los datos');setData(body.data);setUser(body.user);setError(null)}catch(e){setError((e as Error).message)}finally{setLoading(false)}},[])
 useEffect(()=>{void Promise.resolve().then(refresh)},[refresh])
 return <WorkspaceContext.Provider value={{data,user,loading,error,refresh}}>{children}</WorkspaceContext.Provider>
}
export function useWorkspace(){const ctx=useContext(WorkspaceContext);if(!ctx)throw new Error('WorkspaceProvider requerido');return ctx}
export function rows(data:WorkspaceData,key:string):Row[]{return data[key]||[]}
export function str(row:Row|undefined,key:string):string{return String(row?.[key]??'')}
