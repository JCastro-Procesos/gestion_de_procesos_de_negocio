import {describe,expect,it} from 'vitest';
import {ITM_MACRO_PROPOSALS} from './itmMacroProposals';
import {emptyMacroProfile,validateMacroProfile} from './macroinitiative';
describe('propuesta de macroiniciativas ITM',()=>{
 it('tiene M1 a M4 con fichas válidas una vez asignados responsables',()=>{
  expect(ITM_MACRO_PROPOSALS.map(p=>p.code)).toEqual(['M1','M2','M3','M4']);
  for(const p of ITM_MACRO_PROPOSALS){
   const profile={...emptyMacroProfile(),...p.profile,sponsorUserId:1,processOwnerUserId:2};
   expect(validateMacroProfile(profile),p.code).toBe('');
   expect(p.objective.length).toBeGreaterThan(20);expect(p.areas.length).toBeGreaterThanOrEqual(5);
   expect(p.profile.department).toBe(p.areas[0].name);
   expect(p.profile.dependencies).toContain('Áreas involucradas');
  }
 });
 it('cada macro trae KPIs predeterminados coherentes y sin cifras inventadas',()=>{
  for(const p of ITM_MACRO_PROPOSALS){expect(p.kpis.length).toBe(3);for(const x of p.kpis){expect(x.baseline).toBeNull();expect(x.target).toBeNull();expect(x.name&&x.unit&&x.formula).toBeTruthy();expect(['increase','decrease']).toContain(x.direction)}expect(new Set(p.kpis.map(x=>x.id)).size).toBe(3)}
 });
 it('respeta los límites de longitud del servidor',()=>{
  for(const p of ITM_MACRO_PROPOSALS){expect(p.title.length).toBeLessThanOrEqual(190);expect(p.profile.department.length).toBeLessThanOrEqual(120);expect(p.profile.dependencies.length).toBeLessThanOrEqual(2000);expect(p.profile.scopeText.length).toBeLessThanOrEqual(5000)}
 });
});
