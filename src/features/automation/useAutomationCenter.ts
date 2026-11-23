import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {Workspace} from '../../domain/model';
import type {CurrentUser} from '../../data/processoneApi';
import {api} from '../../data/processoneApi';
import type {GovernanceItem} from '../../domain/governance';
import {localCalendarDate} from '../../domain/governance';
import {automationAlerts,automationForecast,automationSettingsFor,alertIsRead,alertIsSnoozed,addCalendarDays} from '../../domain/automation';
import type {FollowUpAlert,PersonalAlerts} from '../../domain/automation';
function readPersonal(key:string):PersonalAlerts{try{const parsed=JSON.parse(localStorage.getItem(key)||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))return parsed as PersonalAlerts}catch{/* Solo preferencias personales. */}return {}}
export function useAutomationCenter(workspace:Workspace,user:CurrentUser|null){
 const [today,setToday]=useState(()=>localCalendarDate()),[governance,setGovernance]=useState<GovernanceItem[]>([]),[governanceError,setGovernanceError]=useState(''),[updatedAt,setUpdatedAt]=useState(''),[personalError,setPersonalError]=useState(''),[refreshing,setRefreshing]=useState(false);
 const [personal,setPersonal]=useState<PersonalAlerts>({});const key='processone-alerts-v2:'+window.location.host+window.location.pathname+':'+(user?.id??'pending');const flight=useRef(false),alive=useRef(true);
 useEffect(()=>{setPersonal(readPersonal(key));setPersonalError('')},[key]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const refresh=useCallback(async()=>{setToday(localCalendarDate());if(!user||flight.current)return;flight.current=true;setRefreshing(true);try{const r=await api<{items:GovernanceItem[]}>('governance');if(alive.current){setGovernance(r.items);setGovernanceError('');setUpdatedAt(new Date().toISOString())}}catch(e){if(alive.current)setGovernanceError(e instanceof Error?e.message:String(e))}finally{flight.current=false;if(alive.current)setRefreshing(false)}},[user?.id]);
 useEffect(()=>{void refresh();const tick=()=>{if(document.visibilityState==='visible')void refresh()};const timer=window.setInterval(tick,60000);window.addEventListener('focus',tick);document.addEventListener('visibilitychange',tick);return()=>{window.clearInterval(timer);window.removeEventListener('focus',tick);document.removeEventListener('visibilitychange',tick)}},[refresh]);
 const settings=useMemo(()=>automationSettingsFor(workspace),[workspace.automationSettings]),alerts=useMemo(()=>automationAlerts(workspace,governance,today),[workspace,governance,today]);
 const active=alerts.filter(a=>!alertIsSnoozed(a,personal,today));const unread=active.filter(a=>!alertIsRead(a,personal));
 const change=(a:FollowUpAlert,operation:'read'|'snooze'|'restore')=>{setPersonal(old=>{const next={...old,[a.id]:{fingerprint:a.fingerprint,read:operation==='read',...(operation==='snooze'?{snoozedUntil:addCalendarDays(today,1)}:{})}};try{const bounded=Object.fromEntries(Object.entries(next).filter(([id])=>alerts.some(x=>x.id===id)));localStorage.setItem(key,JSON.stringify(bounded));setPersonalError('')}catch{setPersonalError('No se pudieron guardar tus preferencias en este navegador.')}return next})};
 const reset=()=>{setPersonal({});try{localStorage.removeItem(key);setPersonalError('')}catch{setPersonalError('No se pudieron restablecer tus preferencias locales.')}};
 return {today,governance,governanceError,updatedAt,personalError,refreshing,refresh,settings,alerts,active,unread,personal,change,reset,forecasts:automationForecast(workspace,today)};
}
export type AutomationCenter=ReturnType<typeof useAutomationCenter>;
