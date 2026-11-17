import test from 'node:test'
import assert from 'node:assert/strict'
import { indicators } from '../src/lib/indicators.ts'
test('excluye no aplicables del denominador',()=>{const actual=indicators([{status:'IMPLEMENTADO'},{status:'PARCIALMENTE_IMPLEMENTADO'},{status:'NO_IMPLEMENTADO'},{status:'NO_APLICABLE'}]);assert.equal(actual.applicable,3);assert.equal(actual.notApplicable,1);assert.equal(actual.implementation,33.3);assert.equal(actual.partialPercent,33.3);assert.equal(actual.missingPercent,33.3)})
test('sin controles aplicables no divide entre cero',()=>{const actual=indicators([{status:'NO_APLICABLE'}]);assert.equal(actual.applicable,0);assert.equal(actual.implementation,null);assert.equal(actual.partialPercent,null);assert.equal(actual.missingPercent,null)})
