import type {ReactNode} from 'react';
import {kindInfo,UNLINKED_META,type MacroMeta,type ProjectKind} from '../../domain/portfolio';

/** Selector segmentado (vistas, filtros). Accesible: grupo de botones con aria-pressed. */
export function Segmented<T extends string>({label,value,options,onChange}:{label:string;value:T;options:readonly {id:T;label:string;icon?:ReactNode;count?:number}[];onChange:(v:T)=>void}){
  return <div className="pd-seg" role="group" aria-label={label}>{options.map(o=><button key={o.id} type="button" aria-pressed={value===o.id} className={value===o.id?'on':''} onClick={()=>onChange(o.id)}>{o.icon}<span>{o.label}</span>{typeof o.count==='number'&&<em>{o.count}</em>}</button>)}</div>;
}
/** Etiqueta de macroiniciativa con su color. Sin dato muestra «Sin macroiniciativa». */
export function MacroTag({meta,compact}:{meta?:MacroMeta|null;compact?:boolean}){
  const m=meta??{...UNLINKED_META,id:0,index:-1};
  return <span className="pd-tag" style={{background:m.tint,color:m.ink,borderColor:m.color+'55'}} title={m.title}><i style={{background:m.color}}/>{meta?m.code:'Sin macro'}{!compact&&meta&&<span className="pd-tag-name">{m.title}</span>}</span>;
}
const KIND_TONE:Record<ProjectKind,{bg:string;fg:string}>={Estratégico:{bg:'#e6f0fc',fg:'#0d4a92'},Metodológico:{bg:'#e0f7f5',fg:'#0a6b66'},Análisis:{bg:'#fdf0e0',fg:'#8f5207'}};
export function KindBadge({kind}:{kind:ProjectKind}){const t=KIND_TONE[kind];return <span className="pd-kind" style={{background:t.bg,color:t.fg}} title={kindInfo(kind).description}>{kindInfo(kind).short}</span>}
export function MethodTag({name}:{name?:string|null}){return <span className={`pd-method ${name?'':'none'}`}>{name||'Sin metodología'}</span>}
/** Anillo de avance. El número siempre se muestra: el color nunca es la única señal. */
export function Ring({value,size=56,color='#1565c0',label}:{value:number;size?:number;color?:string;label?:string}){
  const v=Math.max(0,Math.min(100,Math.round(value)));const r=(size-8)/2,c=2*Math.PI*r;
  return <span className="pd-ring" style={{width:size,height:size}} role="img" aria-label={`${label??'Avance'} ${v}%`}><svg width={size} height={size} aria-hidden="true"><circle cx={size/2} cy={size/2} r={r} className="pd-ring-bg"/><circle cx={size/2} cy={size/2} r={r} stroke={color} strokeDasharray={c} strokeDashoffset={c*(1-v/100)} className="pd-ring-fg" transform={`rotate(-90 ${size/2} ${size/2})`}/></svg><b style={{fontSize:Math.max(11,size*0.26)}}>{v}%</b></span>;
}
export function Bar({value,color='#1565c0'}:{value:number;color?:string}){const v=Math.max(0,Math.min(100,value));return <span className="pd-bar" role="img" aria-label={`${Math.round(v)}%`}><i style={{width:v+'%',background:color}}/></span>}
export function Stat({label,value,note,tone='blue',onClick}:{label:string;value:ReactNode;note?:string;tone?:'blue'|'teal'|'amber'|'red'|'violet';onClick?:()=>void}){
  const body=<><span className="pd-stat-label">{label}</span><b className="pd-stat-value">{value}</b>{note&&<span className="pd-stat-note">{note}</span>}</>;
  return onClick?<button type="button" className={`pd-stat pd-${tone} click`} onClick={onClick}>{body}</button>:<div className={`pd-stat pd-${tone}`}>{body}</div>;
}
export function PageHead({eyebrow,title,text,actions}:{eyebrow?:string;title:string;text?:string;actions?:ReactNode}){
  return <header className="pd-head"><div>{eyebrow&&<span className="pd-eyebrow">{eyebrow}</span>}<h2>{title}</h2>{text&&<p>{text}</p>}</div>{actions&&<div className="pd-head-actions">{actions}</div>}</header>;
}
export function Empty({title,text,action}:{title:string;text?:string;action?:ReactNode}){return <div className="pd-empty"><b>{title}</b>{text&&<p>{text}</p>}{action}</div>}
export const shortDate=(d:string)=>d?new Date(d+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'short'}):'Sin fecha';
