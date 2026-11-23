import { describe, expect, it } from 'vitest';
import { validateApprovedProjectGovernance, validateCellCapacity, validateTemplateStage, validateGovernanceAssignments, validateInitiativeLinks } from './initiativeArchitecture';

describe('v1.2 fundamentos y datos', () => {
  it('rechaza aprobar sin los seis vínculos obligatorios', () => {
    expect(validateApprovedProjectGovernance({projectId:'P-1'})).toEqual([
      'Falta primaryInitiativeId','Falta cellId','Falta processOwnerUserId',
      'Falta projectManagerUserId','Falta methodologyTemplateVersionId'
    ]);
  });
  it('acepta una asignación completa', () => {
    expect(validateApprovedProjectGovernance({
      projectId:'P-1',primaryInitiativeId:'I-1',cellId:'C-1',
      processOwnerUserId:'U-1',projectManagerUserId:'U-2',
      methodologyTemplateVersionId:'M-1'
    })).toEqual([]);
  });
  it('no acepta campos de espacios vacíos', () => {
    expect(validateApprovedProjectGovernance({
      projectId:' ',primaryInitiativeId:'I',cellId:'C',
      processOwnerUserId:'U',projectManagerUserId:'P',methodologyTemplateVersionId:'M'
    })).toEqual(['Falta projectId']);
  });
  it('admite sólo las seis etapas corporativas', () => {
    expect([1,2,3,4,5,6].every(validateTemplateStage)).toBe(true);
    expect([0,7,1.5,-1].some(validateTemplateStage)).toBe(false);
  });
  it('impide capacidades negativas o no finitas', () => {
    expect(validateCellCapacity(null)).toBe(true);
    expect(validateCellCapacity(0)).toBe(true);
    expect(validateCellCapacity(40)).toBe(true);
    expect(validateCellCapacity(-1)).toBe(false);
    expect(validateCellCapacity(Number.NaN)).toBe(false);
  });
});

describe('roles independientes y vínculos de iniciativas', () => {
 const active=new Set(['U-1','U-2']);
 it('permite el mismo usuario como Process Owner y responsable del proyecto', () => {
  expect(validateGovernanceAssignments({
   projectId:'P-1',primaryInitiativeId:'I-1',cellId:'C-1',
   processOwnerUserId:'U-1',projectManagerUserId:'U-1',methodologyTemplateVersionId:'M-1'
  },active)).toEqual([]);
 });
 it('rechaza usuarios inactivos en cualquiera de los dos roles', () => {
  expect(validateGovernanceAssignments({
   projectId:'P-1',primaryInitiativeId:'I-1',cellId:'C-1',
   processOwnerUserId:'U-3',projectManagerUserId:'U-2',methodologyTemplateVersionId:'M-1'
  },active)).toContain('Usuario inactivo o inexistente: processOwnerUserId');
 });
 const link=(id:string,role:'Principal'|'Secundaria')=>({projectId:'P-1',initiativeId:id,role,contributionDescription:null});
 it('requiere exactamente una iniciativa principal para proyectos aprobados',()=>{
  expect(validateInitiativeLinks('P-1',[link('I-1','Secundaria')],true)).toContain('Un proyecto aprobado requiere exactamente una iniciativa principal');
  expect(validateInitiativeLinks('P-1',[link('I-1','Principal'),link('I-2','Secundaria')],true)).toEqual([]);
 });
 it('permite regularización histórica y rechaza duplicados',()=>{
  expect(validateInitiativeLinks('P-1',[],false)).toEqual([]);
  expect(validateInitiativeLinks('P-1',[link('I-1','Principal'),link('I-1','Secundaria')],true)).toContain('Iniciativas duplicadas en el proyecto');
 });
});
