import {describe,it,expect} from 'vitest';
import {pendingTemplateActivities} from './projectTemplateIntegration';
import type {Stage} from './model';
describe('incorporación con origen',()=>{
 const proposed={id:7,title:'Validar diagnóstico',deliverable:null,acceptance_criteria:null};
 const stage={activities:[{name:'Nombre editado por el usuario',origin:{templateId:12,activityId:7}}]} as Stage;
 it('no duplica una actividad incorporada aunque se renombre',()=>expect(pendingTemplateActivities(stage,[proposed],12)).toEqual([]));
 it('no confunde identificadores de plantillas distintas',()=>expect(pendingTemplateActivities(stage,[proposed],13)).toEqual([proposed]));
 it('conserva deduplicación por nombre en históricos sin origen',()=>expect(pendingTemplateActivities({activities:[{name:' Validar diagnóstico '}]} as Stage,[proposed],12)).toEqual([]));
 it('omite propuestas repetidas y vacías',()=>expect(pendingTemplateActivities(undefined,[proposed,proposed,{...proposed,id:8,title:' '}],12)).toEqual([proposed]));
});
