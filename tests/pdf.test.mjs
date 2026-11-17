import test from 'node:test'
import assert from 'node:assert/strict'
import { PDFDocument } from 'pdf-lib'
import { reportPdf } from '../src/lib/pdf.ts'

test('genera un PDF desde la instantánea almacenada',async()=>{
 const report={id:'00000000-0000-0000-0000-000000000001',report_version:1,generated_at:'2026-11-13T12:00:00Z',conclusions:'Resultado académico validado por el auditor responsable.',snapshot_data:{
  audit:{name:'Auditoría de prueba',objective:'Evaluar controles',scope:'Sistemas internos',start_date:'2026-11-01',end_date:'2026-11-30'},
  organization:{name:'Empresa ABC'},responsible:{full_name:'Auditor de prueba'},
  controls:[{id:'c1',code:'8.23',name:'Filtrado web',standard_source:'ISO/IEC 27002:2022',evaluation_criteria:'Política y registros'}],
  evaluations:[{control_id:'c1',status:'IMPLEMENTADO',observations:'Revisado'}],evidences:[],findings:[],recommendations:[],findingEvidences:[],
  indicators:{implemented:1,partial:0,missing:0,notApplicable:0,applicable:1,evaluated:1,implementation:100,partialPercent:0,missingPercent:0},
  methodology:{references:['ISO/IEC 27002:2022'],procedure:'Revisión académica'},disclaimer:'No certifica cumplimiento.'
 }}
 const bytes=await reportPdf(report)
 assert.equal(Buffer.from(bytes).subarray(0,5).toString(),'%PDF-')
 const pdf=await PDFDocument.load(bytes)
 assert.ok(pdf.getPageCount()>=1)
})
