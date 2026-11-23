import {describe,expect,it} from 'vitest';
import {kpiProgress,aggregateKpiProgress} from './initiativeKpi';
describe('medición KPI',()=>{
 it('progreso creciente',()=>{expect(kpiProgress(10,30,20)).toBe(50);expect(kpiProgress(10,30,35)).toBe(100)});
 it('progreso decreciente',()=>{expect(kpiProgress(100,60,80)).toBe(50);expect(kpiProgress(100,60,50)).toBe(100)});
 it('sin medición no equivale a cero',()=>expect(kpiProgress(10,20,null)).toBeNull());
 it('evita división por cero',()=>expect(kpiProgress(10,10,10)).toBeNull());
 it('consolida solo mediciones existentes',()=>{expect(aggregateKpiProgress([50,null,100])).toBe(75);expect(aggregateKpiProgress([null])).toBeNull()});
});