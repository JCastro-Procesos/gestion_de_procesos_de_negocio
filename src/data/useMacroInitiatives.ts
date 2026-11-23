import {useCallback,useEffect,useMemo,useState} from 'react';
import {api} from './processoneApi';
import type {MacroInitiative} from '../domain/macroinitiative';
import {macroMetas,type MacroMeta} from '../domain/portfolio';

/** Carga las macroiniciativas una vez por pantalla y entrega su código y color estables. */
export function useMacroInitiatives(){
  const [items,setItems]=useState<MacroInitiative[]>([]);
  const [loaded,setLoaded]=useState(false);
  const [error,setError]=useState('');
  const reload=useCallback(async()=>{
    try{const r=await api<{initiatives:MacroInitiative[]}>('initiatives');setItems(r.initiatives??[]);setError('')}
    catch(e){setError(e instanceof Error?e.message:String(e))}
    finally{setLoaded(true)}
  },[]);
  useEffect(()=>{void reload()},[reload]);
  const metas:MacroMeta[]=useMemo(()=>macroMetas(items),[items]);
  return {items,metas,loaded,error,reload};
}
