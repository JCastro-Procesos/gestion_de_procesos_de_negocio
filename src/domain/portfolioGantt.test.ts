import {describe,it,expect} from 'vitest';
import {ganttInterval,ganttPosition,ganttMonths,ganttWeeks,portfolioGanttRows,initialGanttMonth} from './portfolioGantt';
import {createEmptyWorkspace} from '../data/storage';
import type {Project,Stage} from './model';
const p={id:'p',startDate:'2026-11-01',dueDate:'2026-11-30'} as Project;
const stage=(id:string,startDate:string,dueDate:string,order=1):Stage=>({id,projectId:'p',order,name:id,objective:'',startDate,dueDate,status:'Por iniciar',progress:0,activities:[]});
describe('Gantt de portafolio',()=>{
 it('valida fechas completas y rechaza rangos invertidos sin inventar días',()=>{expect(ganttInterval('2026-02-30','2026-03-01')).toBeNull();expect(ganttInterval('2026-12-01','2026-11-01')).toBeNull();expect(ganttInterval('','')).toBeNull();expect(ganttInterval('2026-11-01','2026-11-01')).toEqual({start:'2026-11-01',end:'2026-11-01'})});
 it('mantiene visibles actividades de un día y recorta intervalos correctamente',()=>{expect(ganttPosition({start:'2026-11-01',end:'2026-11-01'},'2026-11-01','2026-11-10')?.width).toBe(10);expect(ganttPosition({start:'2026-10-01',end:'2026-12-01'},'2026-11-01','2026-11-30')).toEqual({left:0,width:100,clippedStart:true,clippedEnd:true});expect(ganttPosition({start:'2027-01-01',end:'2027-02-01'},'2026-11-01','2026-11-30')).toBeNull()});
 it('dibuja meses por días reales incluidos bisiestos y cambio de año',()=>{const months=ganttMonths('2027-12-01',3);expect(months[0].end).toBe('2027-12-31');expect(months[1].start).toBe('2028-01-01');expect(months[2].end).toBe('2028-02-29')});
 it('divide semanas en lunes a domingo sin forzar cuatro por mes',()=>{const weeks=ganttWeeks('2026-11-01','2026-11-30');expect(weeks[0]).toMatchObject({start:'2026-11-01',end:'2026-11-01'});expect(weeks[1]).toMatchObject({start:'2026-11-02',end:'2026-11-08'});expect(weeks.at(-1)?.end).toBe('2026-11-30');expect(weeks.length).toBe(6)});
 it('separa solapamientos y reutiliza carriles cuando el intervalo termina',()=>{const w={...createEmptyWorkspace(),projects:[p],stages:[stage('a','2026-11-01','2026-11-10'),stage('b','2026-11-05','2026-11-12',2),stage('c','2026-11-11','2026-11-15',3)]};const row=portfolioGanttRows(w)[0];expect(row.lanes).toBe(2);expect(row.stages.map(s=>s.lane)).toEqual([0,1,0])});
 it('preserva huecos, proyectos sin etapas y fechas inválidas',()=>{const w={...createEmptyWorkspace(),projects:[p],stages:[stage('a','','2026-11-10')]};expect(portfolioGanttRows(w)[0].stages).toEqual([]);expect(portfolioGanttRows(w)[0].invalidStages).toHaveLength(1);expect(portfolioGanttRows({...w,stages:[]})[0].interval).toEqual({start:p.startDate,end:p.dueDate})});
 it('inicia en la primera fecha registrada o en el mes actual sin datos',()=>{expect(initialGanttMonth(createEmptyWorkspace(),'2026-11-02')).toBe('2026-11-01');expect(initialGanttMonth({...createEmptyWorkspace(),projects:[p],stages:[stage('a','2026-10-15','2026-11-01')]})).toBe('2026-10-01')});
});
