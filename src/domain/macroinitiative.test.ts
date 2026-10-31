import {describe,it,expect} from 'vitest';
import {emptyMacroProfile,validateMacroProfile} from './macroinitiative';
const valid=()=>({...emptyMacroProfile(),strategicAlignment:'Eficiencia',problemStatement:'Demoras',expectedBenefit:'Menos tiempo',scopeText:'Proceso de compra',department:'Compras',sponsorUserId:1,processOwnerUserId:2,startDate:'2026-11-01',targetDate:'2026-12-01',successCriteria:'Reducir 20%',measurementPlan:'Medición mensual del ciclo'});
describe('ficha de macroiniciativa',()=>{
 it('exige justificación, responsables y medición',()=>{expect(validateMacroProfile(emptyMacroProfile())).toContain('alineación');expect(validateMacroProfile({...valid(),sponsorUserId:null})).toContain('patrocinador');expect(validateMacroProfile({...valid(),measurementPlan:''})).toContain('medición')});
 it('acepta ficha completa sin inventar presupuesto ni exigir proyectos',()=>expect(validateMacroProfile(valid())).toBe(''));
 it('rechaza fechas inexistentes o invertidas',()=>{expect(validateMacroProfile({...valid(),startDate:'2026-02-30'})).toContain('fechas');expect(validateMacroProfile({...valid(),targetDate:'2026-10-01'})).toContain('fechas')});
 it('valida código y presupuesto opcionales',()=>{expect(validateMacroProfile({...valid(),code:'con espacios'})).toContain('Código');expect(validateMacroProfile({...valid(),estimatedBudget:'-1'})).toContain('presupuesto');expect(validateMacroProfile({...valid(),estimatedBudget:'0',code:'MAC-01'})).toBe('')});
});
