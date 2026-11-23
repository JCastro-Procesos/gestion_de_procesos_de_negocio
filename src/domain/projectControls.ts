import type {Workspace} from './model';
export interface Expense{id:string;description:string;amount:number;date:string;type:'Comprometido'|'Pagado'}
export interface Budget{approved:number;hourRate:number;expenses:Expense[]}
export interface PlanMeta{baseline?:Record<string,{start:string;end:string;hours:number}>;dependencies?:Record<string,string[]>}
export interface Benefit{id:string;projectId:string;name:string;target:number;actual:number;unit:string}
export interface ProjectControls{version:1;budgets:Record<string,Budget>;planning:Record<string,PlanMeta>;benefits:Benefit[]}
export const controlsFor=(w:Workspace):ProjectControls=>w.projectControls??{version:1,budgets:{},planning:{},benefits:[]};
export function legacyControls():Partial<ProjectControls>{
 const read=(key:string)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
 return {budgets:read('itm-budget-costs-v1')??{},planning:read('itm-project-planning-v1')??{},benefits:read('itm-project-benefits-v1')??[]};
}
/** Only copy missing project records. Shared values always win; local copies are retained. */
export function mergeLegacyControls(w:Workspace,legacy:Partial<ProjectControls>):ProjectControls{
 const current=controlsFor(w),projects=new Set(w.projects.map(p=>p.id));
 const budgets={...current.budgets},planning={...current.planning};
 for(const [id,b] of Object.entries(legacy.budgets??{}))if(projects.has(id)&&!Object.hasOwn(budgets,id))budgets[id]=b;
 for(const [id,p] of Object.entries(legacy.planning??{}))if(projects.has(id)&&!Object.hasOwn(planning,id))planning[id]=p;
 const ids=new Set(current.benefits.map(b=>b.id));const benefits=[...current.benefits,...(Array.isArray(legacy.benefits)?legacy.benefits:[]).filter(b=>projects.has(b.projectId)&&!ids.has(b.id))];
 return {version:1,budgets,planning,benefits};
}
