import { describe, expect, it } from 'vitest';
import { validateApprovedProjectGovernance, validateCellCapacity, validateTemplateStage } from './initiativeArchitecture';

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
