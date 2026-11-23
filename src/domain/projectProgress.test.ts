import {describe,it,expect} from 'vitest';
import {officialProjectProgress} from './projectProgress';
import {projectProgress} from './metrics';
import {weightedProjectProgress} from './methodologies';
import {weightedProjectProgress as operationalProgress} from './operationalMetrics';
import {createEmptyWorkspace} from '../data/storage';
import type {Stage,Project} from './model';
const stages=():Stage[]=>Array.from({length:6},(_,i)=>({id:'s'+i,projectId:'p',order:i+1,name:'Etapa',objective:'',startDate:'',dueDate:'',status:'En curso',progress:i===0?100:0,activities:[]}));
describe('avance oficial único',()=>{
 it('usa pesos por tipo sin depender del orden del arreglo',()=>{expect(officialProjectProgress(stages(),'Optimización')).toBe(10);const s=stages();s[0].progress=0;s[4].progress=100;expect(officialProjectProgress(s,'Tecnológico')).toBe(30);expect(officialProjectProgress(s.reverse(),'Tecnológico')).toBe(30)});
 it('usa porcentajes reales de actividades sin reducirlos a estados discretos',()=>{const s=stages();s[0].activities=[{id:'a',name:'A',deliverable:'D',ownerId:'m',startDate:'',dueDate:'',status:'En curso',progress:60}];expect(officialProjectProgress(s)).toBe(6)});
 it('planes históricos utilizan pesos uniformes y limitan valores inválidos',()=>{const s=stages().slice(0,2);expect(officialProjectProgress(s)).toBe(50);s[0].progress=Infinity;s[1].progress=200;expect(officialProjectProgress(s)).toBe(50);expect(officialProjectProgress([])).toBe(0)});
 it('portafolio, métricas y consolidado operativo entregan el mismo resultado',()=>{const s=stages(),p={id:'p',planType:'Tecnológico'} as Project,w={...createEmptyWorkspace(),projects:[p],stages:s};expect(projectProgress('p',s,p.planType)).toBe(weightedProjectProgress(s,p.planType));expect(operationalProgress('p',w)).toBe(projectProgress('p',s,p.planType))});
});
