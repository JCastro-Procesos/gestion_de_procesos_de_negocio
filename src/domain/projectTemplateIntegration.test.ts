import {describe,it,expect} from 'vitest';
import {pendingTemplateActivities} from './projectTemplateIntegration';
import type {Stage} from './model';
describe('project methodology template integration',()=>{
 it('does not duplicate existing activities or repeated template entries',()=>{
  const stage={activities:[{name:'Diagnóstico inicial'}]} as Stage;
  const rows=[{id:1,title:' diagnóstico INICIAL ',deliverable:null,acceptance_criteria:null},{id:2,title:'Diseño TO-BE',deliverable:null,acceptance_criteria:null},{id:3,title:'diseño to-be',deliverable:null,acceptance_criteria:null}];
  expect(pendingTemplateActivities(stage,rows).map(x=>x.id)).toEqual([2]);
 });
 it('preserves missing stage activities for later migration',()=>expect(pendingTemplateActivities(undefined,[{id:1,title:'Plan',deliverable:null,acceptance_criteria:null}])).toHaveLength(1));
});