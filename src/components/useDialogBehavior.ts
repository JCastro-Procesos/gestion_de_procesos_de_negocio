import {useEffect,useRef,type RefObject} from 'react';

const dialogs:HTMLElement[]=[];
let previousOverflow='';
const selector='a[href],button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),summary,[contenteditable="true"],[tabindex]:not([tabindex="-1"])';
function focusable(root:HTMLElement){
 return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(el=>{
  if(el.tabIndex<0&&!(el.matches('summary,[contenteditable="true"]')&&!el.hasAttribute('tabindex')))return false;
  for(let node:HTMLElement|null=el;node;node=node.parentElement){
   const style=getComputedStyle(node);
   if(node.matches('[hidden],[inert],[aria-hidden="true"]')||style.display==='none'||style.visibility==='hidden')return false;
   if(node instanceof HTMLDetailsElement&&!node.open&&!node.querySelector(':scope > summary')?.contains(el))return false;
   if(node===root)break;
  }
  return true;
 });
}
/** One keyboard/focus owner even when a dialog opens another dialog. */
export function useDialogBehavior(ref:RefObject<HTMLElement|null>,open:boolean,onClose:()=>void){
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  const root=ref.current;if(!open||!root)return;
  const trigger=document.activeElement instanceof HTMLElement?document.activeElement:null;
  if(dialogs.length===0){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden'}
  dialogs.push(root);
  const top=()=>dialogs.at(-1)===root;
  const focusFirst=()=>{(focusable(root)[0]??root).focus({preventScroll:true})};
  focusFirst();
  const onFocus=(event:FocusEvent)=>{if(top()&&event.target instanceof Node&&!root.contains(event.target))focusFirst()};
  const onKey=(event:KeyboardEvent)=>{
   if(!top())return;
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close.current();return}
   if(event.key!=='Tab')return;
   const items=focusable(root),first=items[0],last=items.at(-1);
   if(!first){event.preventDefault();root.focus();return}
   if(event.shiftKey&&(document.activeElement===first||!items.includes(document.activeElement as HTMLElement))){event.preventDefault();last?.focus()}
   else if(!event.shiftKey&&(document.activeElement===last||!items.includes(document.activeElement as HTMLElement))){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKey,true);document.addEventListener('focusin',onFocus);
  return()=>{
   const wasTop=top(),index=dialogs.indexOf(root);if(index>=0)dialogs.splice(index,1);
   document.removeEventListener('keydown',onKey,true);document.removeEventListener('focusin',onFocus);
   if(dialogs.length===0)document.body.style.overflow=previousOverflow;
   if(wasTop&&trigger?.isConnected)trigger.focus({preventScroll:true});
  };
 },[open,ref]);
}
