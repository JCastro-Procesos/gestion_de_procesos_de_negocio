import {describe,expect,it} from 'vitest';
import {ALL_FACETS,activityItems,currentStage,facetsFromString,facetsToString,filterProjects,macroMetas,macroOf,memberWork,nextSteps,projectKind,projectsForMember,summarize,taskItems,validateProjectLinks,withActivityStatus} from './portfolio';
import type {Project,Stage,Workspace} from './model';
import {createEmptyWorkspace} from '../data/storage';

const day=(offset:number)=>{const d=new Date();d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10)};
const project=(id:string,extra:Partial<Project>={}):Project=>({id,name:id,area:'Área',ownerId:'m1',sponsor:'',methodologyId:2,status:'En ejecución',semaforo:'Verde',startDate:day(-10),dueDate:day(30),goal:'',description:'',createdAt:day(-10),updatedAt:day(-1),...extra});
const stage=(projectId:string,order:number,status:Stage['status'],acts:Stage['activities']=[]):Stage=>({id:`${projectId}-s${order}`,projectId,order,name:'Etapa '+order,objective:'',startDate:day(-10),dueDate:day(10),status,progress:status==='Completada'?100:0,activities:acts});
const activity=(id:string,ownerId:string,status:Stage['activities'][number]['status'],dueDate:string)=>({id,name:'Act '+id,deliverable:'E '+id,ownerId,startDate:day(-5),dueDate,status,progress:status==='Completada'?100:0});
function workspace():Workspace{
 const w=createEmptyWorkspace();
 w.members=[{id:'m1',name:'Ana',role:'Ing',capacityHours:30,email:'ana@x.com',color:'#000'},{id:'m2',name:'Beto',role:'Ing',capacityHours:30,email:'beto@x.com',color:'#000'}];
 w.projects=[project('strategic',{initiativeId:10,methodologyId:2}),project('method',{initiativeId:null,methodologyId:3}),project('analysis',{initiativeId:null,methodologyId:0,ownerId:'m2'})];
 w.stages=[stage('strategic',1,'Completada',[activity('a1','m1','Completada',day(-3))]),stage('strategic',2,'En curso',[activity('a2','m1','En curso',day(-1)),activity('a3','m2','Por iniciar',day(5))]),stage('strategic',3,'Por iniciar',[activity('a4','m1','Por iniciar',day(20))]),
  stage('method',1,'Por iniciar',[activity('a5','m1','Por iniciar',day(3))]),stage('analysis',1,'Completada'),stage('analysis',2,'Completada')];
 w.tasks=[{id:'t1',projectId:'strategic',stageId:'strategic-s2',title:'Tarea',description:'',assigneeId:'m2',status:'En Revisión',priority:'Alta',estimatedHours:2,actualHours:1,startDate:day(-2),dueDate:day(-2),subtasks:[]}];
 return w;
}
describe('tipos de proyecto',()=>{
 it('se deducen de macroiniciativa y metodología',()=>{
  expect(projectKind({initiativeId:5,methodologyId:2})).toBe('Estratégico');
  expect(projectKind({initiativeId:null,methodologyId:2})).toBe('Metodológico');
  expect(projectKind({initiativeId:undefined,methodologyId:0})).toBe('Análisis');
 });
 it('valida combinaciones al crear',()=>{
  const ids=[1,2,3,4,5];
  expect(validateProjectLinks({initiativeId:5,methodologyId:0},null,ids)).toMatch(/necesita una metodología/);
  expect(validateProjectLinks({initiativeId:5,methodologyId:4},[2,3],ids)).toMatch(/no está vinculada/);
  expect(validateProjectLinks({initiativeId:5,methodologyId:3},[2,3],ids)).toBe('');
  expect(validateProjectLinks({initiativeId:null,methodologyId:2},null,ids)).toBe('');
  expect(validateProjectLinks({initiativeId:null,methodologyId:0},null,ids)).toBe('');
  expect(validateProjectLinks({initiativeId:null,methodologyId:9},null,ids)).toMatch(/no existe/);
 });
});
describe('macroiniciativas',()=>{
 it('asigna código y color estables por orden de id',()=>{
  const metas=macroMetas([{id:30,title:'C'},{id:10,title:'A'},{id:20,title:'B',profile:{code:'m7'}}]);
  expect(metas.map(m=>m.code)).toEqual(['M1','M7','M3']);
  expect(macroOf(metas,10)?.title).toBe('A');
  expect(macroOf(metas,null)).toBeNull();
  expect(new Set(metas.map(m=>m.color)).size).toBe(3);
 });
});
describe('filtros por faceta',()=>{
 it('filtra por macroiniciativa, sin macroiniciativa, metodología y tipo',()=>{
  const w=workspace();
  expect(filterProjects(w,ALL_FACETS)).toHaveLength(3);
  expect(filterProjects(w,{...ALL_FACETS,macro:10}).map(p=>p.id)).toEqual(['strategic']);
  expect(filterProjects(w,{...ALL_FACETS,macro:'none'}).map(p=>p.id)).toEqual(['method','analysis']);
  expect(filterProjects(w,{...ALL_FACETS,method:'none'}).map(p=>p.id)).toEqual(['analysis']);
  expect(filterProjects(w,{...ALL_FACETS,method:3}).map(p=>p.id)).toEqual(['method']);
  expect(filterProjects(w,{...ALL_FACETS,kind:'Análisis'}).map(p=>p.id)).toEqual(['analysis']);
 });
 it('conserva el filtro al navegar',()=>{
  const f={macro:12,method:'none' as const,kind:'Metodológico' as const};
  expect(facetsFromString(facetsToString(f))).toEqual(f);
  expect(facetsFromString('basura')).toEqual(ALL_FACETS);
  expect(facetsFromString(null)).toEqual(ALL_FACETS);
 });
});
describe('trabajo y siguientes pasos',()=>{
 it('detecta la etapa actual',()=>{
  const w=workspace();
  expect(currentStage(w.stages.filter(s=>s.projectId==='strategic'))?.order).toBe(2);
  expect(currentStage(w.stages.filter(s=>s.projectId==='analysis'))).toBeNull();
 });
 it('lista actividades y tareas por persona',()=>{
  const w=workspace();
  expect(activityItems(w,{ownerId:'m1'}).map(i=>i.id).sort()).toEqual(['a1','a2','a4','a5']);
  expect(taskItems(w,{assigneeId:'m2'})).toHaveLength(1);
  const mine=memberWork(w,'m2');
  expect(mine.projects.map(p=>p.id).sort()).toEqual(['analysis','strategic']);
  expect(projectsForMember(w,'m1').map(p=>p.id).sort()).toEqual(['method','strategic']);
 });
 it('ordena lo vencido antes que lo próximo y excluye lo completado',()=>{
  const w=workspace();
  const next=nextSteps([...activityItems(w),...taskItems(w)],10);
  expect(next.some(i=>i.status==='Completada')).toBe(false);
  expect(next[0].overdue).toBe(true);
  const firstSoon=next.findIndex(i=>i.dueSoon&&!i.overdue),lastOverdue=next.map(i=>i.overdue).lastIndexOf(true);
  expect(lastOverdue).toBeLessThan(firstSoon);
 });
 it('resume avance, actividades y distribución por etapa',()=>{
  const w=workspace();
  const s=summarize(w,filterProjects(w,{...ALL_FACETS,macro:10}));
  expect(s.projects).toBe(1);
  expect(s.activities).toBe(4);
  expect(s.activitiesDone).toBe(1);
  expect(s.byCurrentStage[1]).toBe(1);
  const all=summarize(w,w.projects);
  expect(all.completed).toBe(1);
  expect(all.byCurrentStage[6]).toBe(1);
 });
 it('cambia el estado de una actividad con el avance oficial',()=>{
  const a=activity('x','m1','Por iniciar',day(1));
  expect(withActivityStatus(a,'Completada').progress).toBe(100);
  expect(withActivityStatus(a,'En revisión').progress).toBe(90);
  expect(withActivityStatus(a,'En curso').progress).toBe(50);
 });
});
