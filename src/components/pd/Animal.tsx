import {useRef,useState} from 'react';
/** Mismos 12 avatares que valida el servidor; cada uno con su color de fondo y nombre. */
export const ANIMALS:{emoji:string;name:string;bg:string}[]=[
 {emoji:'🦊',name:'Zorro',bg:'#fde9d6'},{emoji:'🐯',name:'Tigre',bg:'#fdf0cf'},{emoji:'🦁',name:'León',bg:'#fbe7bd'},{emoji:'🐼',name:'Panda',bg:'#e8edf3'},
 {emoji:'🐻',name:'Oso',bg:'#f1e1d4'},{emoji:'🦉',name:'Búho',bg:'#ece5f7'},{emoji:'🐬',name:'Delfín',bg:'#d9eefb'},{emoji:'🦋',name:'Mariposa',bg:'#e3ecfb'},
 {emoji:'🐢',name:'Tortuga',bg:'#dcf2e3'},{emoji:'🦄',name:'Unicornio',bg:'#f8e3f3'},{emoji:'🐺',name:'Lobo',bg:'#e4e9f0'},{emoji:'🦜',name:'Loro',bg:'#dff5e8'},
];
export const animalInfo=(emoji?:string|null)=>ANIMALS.find(a=>a.emoji===emoji);
export function AnimalAvatar({emoji,name,size=40}:{emoji?:string|null;name?:string;size?:number;bob?:boolean}){
  const info=animalInfo(emoji);
  return <span className={`pd-animal ${info?'pd-animal-idle':''}`} style={{width:size,height:size,fontSize:size*0.55,['--bg' as string]:info?.bg,['--idle-delay' as string]:`-${(((emoji||name||'').length*7+((emoji||name||'x').codePointAt(0)||0))%14)}s`}} role="img" aria-label={info?`Avatar ${info.name}`:`Iniciales de ${name??''}`}>{info?emoji:(name||'?').trim().slice(0,2).toUpperCase()}</span>;
}
type Pos={x:number;y:number};
/** Arena donde los avatares se arrastran con ratón, dedo o teclado (flechas). La posición se recuerda en este navegador. */
export function AnimalArena({people,storageKey='po-arena-v1'}:{people:{id:string;name:string;emoji?:string|null}[];storageKey?:string}){
  const ref=useRef<HTMLDivElement>(null);
  const [pos,setPos]=useState<Record<string,Pos>>(()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}}});
  const [moving,setMoving]=useState('');
  const save=(next:Record<string,Pos>)=>{setPos(next);try{localStorage.setItem(storageKey,JSON.stringify(next))}catch{/* almacenamiento no disponible */}};
  const place=(id:string,i:number):Pos=>pos[id]??{x:(i%6)*16+4,y:Math.floor(i/6)*34+8};
  const clamp=(v:number)=>Math.max(0,Math.min(92,v));
  const start=(e:React.PointerEvent,id:string,i:number)=>{
    const box=ref.current?.getBoundingClientRect();if(!box)return;
    const p=place(id,i);const sx=e.clientX,sy=e.clientY;setMoving(id);(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const move=(ev:PointerEvent)=>setPos(cur=>({...cur,[id]:{x:clamp(p.x+((ev.clientX-sx)/box.width)*100),y:clamp(p.y+((ev.clientY-sy)/box.height)*100)}}));
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);setMoving('');setPos(cur=>{try{localStorage.setItem(storageKey,JSON.stringify(cur))}catch{/* sin almacenamiento */}return cur})};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
  };
  const key=(e:React.KeyboardEvent,id:string,i:number)=>{const moves:Record<string,[number,number]>={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]};const d=moves[e.key];if(!d)return;e.preventDefault();const p=place(id,i);save({...pos,[id]:{x:clamp(p.x+d[0]),y:clamp(p.y+d[1])}})};
  return <div><div className="pd-arena" ref={ref} aria-label="Zona del equipo: arrastra cada avatar">{people.map((m,i)=>{const p=place(m.id,i);return <div key={m.id} className={`pd-mover ${moving===m.id?'moving':''}`} style={{left:p.x+'%',top:p.y+'%'}} tabIndex={0} role="button" aria-label={`${m.name}. Usa las flechas para mover`} onPointerDown={e=>start(e,m.id,i)} onKeyDown={e=>key(e,m.id,i)}><AnimalAvatar emoji={m.emoji} name={m.name} size={moving===m.id?64:54}/><span className="name">{m.name.split(' ')[0]}</span></div>})}</div><p className="pd-hint" style={{marginTop:6}}>Arrastra los avatares (o usa las flechas del teclado). La posición se guarda solo en este navegador.</p><button type="button" className="pd-mini" onClick={()=>{save({})}} style={{marginTop:6}}>Reacomodar</button></div>;
}
