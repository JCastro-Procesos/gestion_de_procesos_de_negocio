import {describe,it,expect} from 'vitest';
import {emptyGovernanceDraft,governanceCandidates,governanceFormError,governanceOverdue,governanceReviewer,localCalendarDate} from './governance';
import type {GovernanceItem} from './governance';
const base={id:'x',severity:'Menor',createdBy:2,ownerUserId:6,approverUserId:3,status:'Pendiente',dueDate:'2026-11-02',implementationStatus:'Pendiente'} as GovernanceItem;
const people=[{id:3,name:'Revisor',reviewImpacts:['Menor'] as const}].map(p=>({...p,reviewImpacts:[...p.reviewImpacts]}));
const draft=()=>({...emptyGovernanceDraft(),title:'Revisar',description:'Justificación',ownerUserId:'6',approverUserId:'3',dueDate:'2026-12-01'});
describe('bandejas y ficha de gobierno',()=>{
 it('solo vence después del día compromiso y excluye rechazados y verificados',()=>{expect(governanceOverdue(base,'2026-11-02')).toBe(false);expect(governanceOverdue(base,'2026-11-03')).toBe(true);expect(governanceOverdue({...base,status:'Rechazado'},'2026-11-03')).toBe(false);expect(governanceOverdue({...base,status:'Aprobado',implementationStatus:'Verificado'},'2026-11-03')).toBe(false);expect(governanceOverdue({...base,status:'Aprobado',implementationStatus:'Implementado'},'2026-11-03')).toBe(true)});
 it('usa el calendario local para compromisos',()=>expect(localCalendarDate(new Date(2026,10,2,23,59))).toBe('2026-11-02'));
 it('filtra revisores por impacto, identidad y asignación',()=>{expect(governanceReviewer(base,3,'gerencia')).toBe(true);expect(governanceReviewer(base,2,'admin')).toBe(false);expect(governanceReviewer(base,6,'direccion')).toBe(false);expect(governanceReviewer({...base,severity:'Crítico'},3,'gerencia')).toBe(false);expect(governanceReviewer(base,7,'gerencia')).toBe(false)});
 it('valida evidencia y alcance de cambios sin inventar valores',()=>{expect(governanceFormError(draft(),2,people)).toBe('');expect(governanceFormError({...draft(),kind:'Entregable'},2,people)).toContain('evidencia');expect(governanceFormError({...draft(),kind:'Cambio'},2,people)).toContain('impacto');expect(governanceFormError({...draft(),evidenceUrl:'https://user:pass@example.org'},2,people)).toContain('credenciales');expect(governanceFormError({...draft(),evidenceUrl:'javascript:alert(1)'},2,people)).toContain('HTTPS')});
 it('rechaza fechas inexistentes y auto revisión',()=>{expect(governanceFormError({...draft(),dueDate:'2026-02-30'},2,people)).toContain('Fecha');expect(governanceFormError(draft(),3,people)).toContain('distinto')});
 it('permite guardar sin revisor solo cuando no hay otra persona elegible',()=>{const noReviewer={...draft(),approverUserId:''};expect(governanceFormError(noReviewer,2,people)).toContain('Selecciona');expect(governanceFormError(noReviewer,3,people)).toBe('');expect(governanceCandidates({...draft(),severity:'Mayor'},2,people)).toEqual([])});

});
