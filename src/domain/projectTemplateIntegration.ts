import type {Stage} from './model';
export interface TemplateActivityForProject {id:number;title:string;deliverable:string|null;acceptance_criteria:string|null}
export function pendingTemplateActivities(stage:Stage|undefined,templates:readonly TemplateActivityForProject[]):TemplateActivityForProject[]{
 const existing=new Set((stage?.activities??[]).map(a=>a.name.trim().toLocaleLowerCase()));
 const seen=new Set<string>();
 return templates.filter(a=>{const name=a.title.trim().toLocaleLowerCase();if(!name||existing.has(name)||seen.has(name))return false;seen.add(name);return true});
}
