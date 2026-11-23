import type {Stage} from './model';
export interface TemplateActivityForProject {id:number;title:string;deliverable:string|null;acceptance_criteria:string|null}
export function pendingTemplateActivities(stage:Stage|undefined,templates:readonly TemplateActivityForProject[],templateId?:number):TemplateActivityForProject[]{
 const normalize=(s:string)=>s.trim().toLocaleLowerCase();
 const existingNames=new Set((stage?.activities??[]).map(a=>normalize(a.name)));
 const existingIds=new Set((stage?.activities??[]).filter(a=>a.origin&&a.origin.templateId===templateId).map(a=>a.origin!.activityId));
 const seen=new Set<string>();
 return templates.filter(a=>{const name=normalize(a.title);if(!name||existingIds.has(Number(a.id))||existingNames.has(name)||seen.has(name))return false;seen.add(name);return true});
}
