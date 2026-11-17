'use client'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
export function PrintAction(){return <Button variant="outline" onClick={()=>window.print()}><Printer size={16}/>Imprimir</Button>}
