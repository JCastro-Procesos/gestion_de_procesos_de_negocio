import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Workspace } from '../../domain/model';
import { projectProgress } from '../../domain/metrics';
import { executiveRows, exportExcel, exportPdf, exportImage, exportPowerPoint, weeklyExecutiveSummary } from '../reports/executiveExports';

type RoadmapItem = { id: number; nombre: string; seccion: string; estado: string; prioridad: string; detalle?: string };
type Source = 'projects' | 'roadmap';
type View = 'Resumen ejecutivo' | 'Portafolio del proyecto' | 'Seguimiento operativo';
const VIEWS: View[] = ['Resumen ejecutivo', 'Portafolio del proyecto', 'Seguimiento operativo'];
const roadmapKey = 'itm-dashboard-roadmap-v1';
const roadmapProgress: Record<string, number> = { Pendiente: 0, 'En análisis': 15, Aprobada: 20, Trabajando: 25, 'En desarrollo': 40, Elaborando: 60, 'En revisión': 85, 'En pruebas': 85, Completada: 100, Descartada: 0 };
const today = () => new Date().toISOString().slice(0, 10);

function loadRoadmap(): RoadmapItem[] {
  try {
    const saved = localStorage.getItem(roadmapKey);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) && parsed.every((item) => item && typeof item.nombre === 'string' && typeof item.seccion === 'string' && typeof item.estado === 'string') ? parsed as RoadmapItem[] : [];
  } catch { return []; }
}
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e6eaf2', borderRadius: 12, padding: 15, minWidth: 0 };
const selectStyle: React.CSSProperties = { width: '100%', border: '1px solid #dfe5f0', borderRadius: 8, background: '#fff', color: '#34415d', padding: '9px 8px', fontSize: 11 };
const buttonStyle: React.CSSProperties = { border: '1px solid #e0e6f0', borderRadius: 9, padding: '10px 12px', background: 'white', color: '#34415d', cursor: 'pointer', fontWeight: 700, fontSize: 11 };
function summaryCard(title: string, value: string | number, color: string, onClick?: () => void) {
  return <button type="button" onClick={onClick} style={{ ...panelStyle, textAlign: 'left', cursor: onClick ? 'pointer' : 'default', background: color, width: '100%' }}><div style={{ fontSize: 10, fontWeight: 650, color: '#56627a' }}>{title}</div><strong style={{ display: 'block', marginTop: 8, fontSize: 25, color: '#274b87' }}>{value}</strong>{onClick && <span style={{ fontSize: 10, color: '#5367d8' }}>Ver detalle →</span>}</button>;
}
function filter(label: string, current: string, options: string[], change: (v: string) => void) {
  return <label style={{ display: 'grid', gap: 5, fontSize: 10, fontWeight: 700, color: '#61718b' }}>{label}<select style={selectStyle} value={current} onChange={(e) => change(e.target.value)}>{options.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>;
}
function ChartPanel({ title, values, onPick }: { title: string; values: { name: string; value: number }[]; onPick?: (name: string) => void }) {
  return <div style={panelStyle}><strong style={{ fontSize: 12, color: '#253b65' }}>{title}</strong>{values.length ? <div style={{ height: 210, marginTop: 12 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={values} layout="vertical" margin={{ left: 0, right: 15, top: 4, bottom: 4 }}><CartesianGrid horizontal={false} stroke="#eef1f6"/><XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} /><YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 10 }} /><Tooltip/><Bar dataKey="value" fill="#5367d8" radius={[0, 5, 5, 0]} onClick={(entry) => { const name = (entry as { name?: string }).name; if (name && onPick) onPick(name); }}/></BarChart></ResponsiveContainer></div> : <p style={{ fontSize: 11, color: '#8993a5' }}>Sin datos para estos filtros.</p>}</div>;
}
function countBy<T>(items: T[], key: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => { const value = key(item) || 'Sin dato'; counts.set(value, (counts.get(value) || 0) + 1); });
  return [...counts].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function ExecutivePowerPanel({ workspace, onOpenProject }: { workspace: Workspace; onOpenProject: (id: string) => void }) {
  const [source, setSource] = useState<Source>('projects');
  const [view, setView] = useState<View>('Resumen ejecutivo');
  const [area, setArea] = useState('Todas');
  const [status, setStatus] = useState('Todos');
  const [priority, setPriority] = useState('Todas');
  const [owner, setOwner] = useState('Todos');
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>(loadRoadmap);
  const [focus, setFocus] = useState('');
  const [methodology, setMethodology] = useState('Todas');
  const [showWeekly, setShowWeekly] = useState(false);
  const [kpis, setKpis] = useState(['Proyectos totales','Proyectos activos','Avance promedio','Actividades totales','Actividades vencidas']);
  const [charts, setCharts] = useState(['Estado','Semáforo','Avance','Próximas actividades']);
  const areas = ['Todas', ...new Set(workspace.projects.map((project) => project.area))];
  const statuses = ['Todos', ...new Set(workspace.projects.map((project) => project.status))];
  const owners = ['Todos', ...new Set(workspace.projects.map((project) => project.ownerId).filter(Boolean))];
  const projects = useMemo(() => workspace.projects.filter((project) => (area === 'Todas' || project.area === area) && (status === 'Todos' || project.status === status) && (owner === 'Todos' || project.ownerId === owner) && (priority === 'Todas' || project.semaforo === priority) && (methodology === 'Todas' || String(project.methodologyId) === methodology)), [workspace.projects, area, status, owner, priority, methodology]);
  const ids = new Set(projects.map((p) => p.id));
  const tasks = workspace.tasks.filter((task) => ids.has(task.projectId));
  const risks = workspace.raids.filter((risk) => ids.has(risk.projectId));
  const average = projects.length ? Math.round(projects.reduce((acc, p) => acc + projectProgress(p.id, workspace.stages), 0) / projects.length) : 0;
  const overdue = tasks.filter((task) => task.dueDate && task.dueDate < today() && task.status !== 'Completado');
  const filteredRoadmap = roadmap.filter((item) => (area === 'Todas' || item.seccion === area) && (status === 'Todos' || item.estado === status) && (priority === 'Todas' || item.prioridad === priority));
  const roadmapAverage = filteredRoadmap.length ? Math.round(filteredRoadmap.reduce((sum, item) => sum + (roadmapProgress[item.estado] ?? 0), 0) / filteredRoadmap.length) : 0;
  const sourceOptions = source === 'projects' ? ['Todas', 'Verde', 'Amarillo', 'Rojo'] : ['Todas', ...new Set(roadmap.map((item) => item.prioridad))];
  const sectionNames = source === 'projects' ? areas : ['Todas', ...new Set(roadmap.map((item) => item.seccion))];
  const stateNames = source === 'projects' ? statuses : ['Todos', ...new Set(roadmap.map((item) => item.estado))];
  const handleSource = (selected: Source) => { setSource(selected); setArea('Todas'); setStatus('Todos'); setPriority('Todas'); setOwner('Todos'); setMethodology('Todas'); setFocus(''); };
  const importRoadmap = async (file?: File) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!Array.isArray(parsed) || !parsed.every((x) => x && typeof x.nombre === 'string' && typeof x.seccion === 'string' && typeof x.estado === 'string' && typeof x.prioridad === 'string')) throw Error('El archivo debe ser el respaldo JSON del roadmap de mejoras.');
      const next = parsed as RoadmapItem[];
      localStorage.setItem(roadmapKey, JSON.stringify(next));
      setRoadmap(next);
    } catch (error) { window.alert(error instanceof Error ? error.message : 'No se pudo leer el archivo.'); }
  };
  const compactGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 9 };
  const chartGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 };
  const rows = executiveRows(workspace, ids);
  const weekly = weeklyExecutiveSummary(workspace, ids);
  const toggle = (name: string, items: string[], setItems: (items: string[]) => void) => setItems(items.includes(name) ? items.filter((v) => v !== name) : [...items, name]);
  const linkStyle: React.CSSProperties = { display: 'flex', width: '100%', justifyContent: 'space-between', gap: 9, border: 0, borderBottom: '1px solid #eef1f6', padding: '10px 2px', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: 11, color: '#3b4964' };
  return <section style={{ ...panelStyle, background: '#f8faff', padding: 16, display: 'grid', gap: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}><div><strong style={{ color: '#243b67', fontSize: 16 }}>Panel de análisis · estilo Power BI</strong><p style={{ fontSize: 11, margin: '4px 0', color: '#7b88a0' }}>Selecciona información, filtra indicadores y abre el detalle de cada proyecto.</p></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{(['projects', 'roadmap'] as Source[]).map((option) => <button key={option} type="button" style={{ ...buttonStyle, background: source === option ? '#223d78' : 'white', color: source === option ? '#fff' : '#34415d' }} onClick={() => handleSource(option)}>{option === 'projects' ? 'Proyectos ITM' : 'Mejoras del roadmap'}</button>)}</div></div>
    {source === 'roadmap' && <div style={{ ...panelStyle, padding: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><span style={{ fontSize: 11 }}>Mejoras cargadas: <b>{roadmap.length}</b>. Importa el JSON exportado desde el HTML del roadmap para consultar sus indicadores.</span><label style={{ ...buttonStyle, display: 'inline-block' }}>Importar roadmap JSON <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { void importRoadmap(e.target.files?.[0]); e.target.value = ''; }}/></label></div>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{VIEWS.map((option) => <button key={option} type="button" style={{ ...buttonStyle, background: view === option ? '#e7ebff' : 'white', color: view === option ? '#334ba3' : '#34415d' }} onClick={() => { setView(option); setFocus(''); }}>{option}</button>)}</div>
    <div style={{ ...compactGrid, gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))' }}>{filter(source === 'projects' ? 'Dirección / área' : 'Sección', area, sectionNames, setArea)}{filter('Estado', status, stateNames, setStatus)}{filter(source === 'projects' ? 'Semáforo' : 'Prioridad', priority, sourceOptions, setPriority)}{source === 'projects' ? <>{filter('Responsable / usuario', owner, owners, setOwner)}{filter('Metodología', methodology, ['Todas', ...new Set(workspace.projects.map((p) => String(p.methodologyId)))], setMethodology)}</> : <div style={{ display: 'flex', alignItems: 'end' }}><button type="button" style={buttonStyle} onClick={() => { setArea('Todas'); setStatus('Todos'); setPriority('Todas'); }}>Limpiar filtros</button></div>}</div>
    {source === 'projects' && <div style={{ ...panelStyle, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}><strong style={{ fontSize: 11 }}>Exportar portafolio filtrado</strong><button style={buttonStyle} onClick={() => exportExcel(rows)}>Excel</button><button style={buttonStyle} onClick={() => exportPdf(rows)}>PDF</button><button style={buttonStyle} onClick={() => exportImage(rows)}>Imagen PNG</button><button style={buttonStyle} onClick={() => exportPowerPoint(rows)}>PowerPoint</button><button style={buttonStyle} onClick={() => setShowWeekly(!showWeekly)}>Resumen semanal {showWeekly ? '▴' : '▾'}</button></div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}><strong style={{ fontSize: 10 }}>Selector de KPIs</strong>{['Proyectos totales','Proyectos activos','Avance promedio','Actividades totales','Actividades vencidas'].map((name) => <button key={name} type="button" aria-pressed={kpis.includes(name)} style={{ ...buttonStyle, padding: '6px 8px', background: kpis.includes(name) ? '#e7ebff' : '#fff' }} onClick={() => toggle(name, kpis, setKpis)}>{kpis.includes(name) ? '✓ ' : '+ '}{name}</button>)}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}><strong style={{ fontSize: 10 }}>Visualizaciones</strong>{['Estado','Semáforo','Avance','Próximas actividades'].map((name) => <button key={name} type="button" aria-pressed={charts.includes(name)} style={{ ...buttonStyle, padding: '6px 8px', background: charts.includes(name) ? '#e7ebff' : '#fff' }} onClick={() => toggle(name, charts, setCharts)}>{charts.includes(name) ? '✓ ' : '+ '}{name}</button>)}</div>
      {showWeekly && <div style={{ background: '#f8faff', padding: 12, borderRadius: 9, fontSize: 11, lineHeight: 1.8 }}><strong>Resumen semanal · {weekly.today} al {weekly.next}</strong><p>Proyectos: {weekly.projects.length} · Avance: {weekly.avg}% · En riesgo: {weekly.atRisk.length} · RAID abierto: {weekly.risks.length} · Hitos vencidos: {weekly.overdue.length} · Próximas tareas: {weekly.upcoming.length}</p><strong>Riesgos</strong>{weekly.atRisk.slice(0,5).map((p) => <div key={p.id}>• {p.name} · {p.semaforo}</div>)}<strong>Próximos hitos / tareas</strong>{weekly.upcoming.slice(0,8).map((t) => <div key={t.id}>• {t.dueDate} · {t.title}</div>)}<p style={{ color: '#8790a5' }}>Reporte generado bajo demanda con la información local actual. No hay envíos automáticos.</p></div>}
    </div>}
    {source === 'projects' ? <>
      <div style={compactGrid}>{kpis.includes('Proyectos totales') && summaryCard('Proyectos totales', projects.length, '#eaf1fb', () => setView('Portafolio del proyecto'))}{kpis.includes('Proyectos activos') && summaryCard('Proyectos activos', projects.filter((p) => p.status !== 'Completado').length, '#edf7ed', () => { setView('Portafolio del proyecto'); setFocus('Activos'); })}{kpis.includes('Avance promedio') && summaryCard('Avance promedio', average + '%', '#f7eafa')}{kpis.includes('Actividades totales') && summaryCard('Actividades totales', tasks.length, '#fff2e7', () => setView('Seguimiento operativo'))}{kpis.includes('Actividades vencidas') && summaryCard('Actividades vencidas', overdue.length, '#ffebed', () => { setView('Seguimiento operativo'); setFocus('Vencidas'); })}</div>
      {view === 'Resumen ejecutivo' && <div style={chartGrid}>{charts.includes('Estado') && <ChartPanel title="Proyectos por estado" values={countBy(projects, (p) => p.status)} onPick={(name) => setStatus(name)} />}{charts.includes('Semáforo') && <ChartPanel title="Semáforo de proyectos" values={countBy(projects, (p) => p.semaforo)} onPick={(name) => setPriority(name)}/>} {charts.includes('Avance') && <div style={panelStyle}><strong style={{ fontSize: 12 }}>Avance por proyecto</strong>{projects.slice(0, 12).map((p) => <button key={p.id} type="button" onClick={() => onOpenProject(p.id)} style={linkStyle}><span>{p.name}</span><b>{projectProgress(p.id, workspace.stages)}%</b></button>)}</div>}{charts.includes('Próximas actividades') && <div style={panelStyle}><strong style={{ fontSize: 12 }}>Próximas actividades</strong>{tasks.filter((t) => t.dueDate && t.status !== 'Completado').sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 8).map((t) => <button key={t.id} type="button" onClick={() => onOpenProject(t.projectId)} style={linkStyle}><span>{t.title}</span><span>{t.dueDate}</span></button>)}</div>}</div>}
      {view === 'Portafolio del proyecto' && <div style={chartGrid}><ChartPanel title="Proyectos por área" values={countBy(projects, (p) => p.area)} onPick={(name) => setArea(name)}/><div style={panelStyle}><strong style={{ fontSize: 12 }}>Detalle del portafolio · selecciona un proyecto</strong>{projects.filter((p) => focus !== 'Activos' || p.status !== 'Completado').map((p) => <button type="button" key={p.id} style={linkStyle} onClick={() => onOpenProject(p.id)}><span>{p.name}</span><b>{projectProgress(p.id, workspace.stages)}%</b></button>)}</div></div>}
      {view === 'Seguimiento operativo' && <div style={chartGrid}><ChartPanel title="Tareas por estado" values={countBy(focus === 'Vencidas' ? overdue : tasks, (t) => t.status)}/><ChartPanel title="RAID por tipo" values={countBy(risks, (r) => r.type)}/><div style={panelStyle}><strong style={{ fontSize: 12 }}>Tareas {focus === 'Vencidas' ? 'vencidas' : 'abiertas'}</strong>{(focus === 'Vencidas' ? overdue : tasks.filter((t) => t.status !== 'Completado')).slice(0, 15).map((t) => <button key={t.id} type="button" onClick={() => onOpenProject(t.projectId)} style={linkStyle}><span>{t.title}</span><span>{t.dueDate || 'Sin fecha'}</span></button>)}</div></div>}
    </> : <>
      <div style={compactGrid}>{summaryCard('Mejoras totales', filteredRoadmap.length, '#eaf1fb')}{summaryCard('Trabajando / elaborando', filteredRoadmap.filter((m) => ['Trabajando', 'Elaborando', 'En desarrollo'].includes(m.estado)).length, '#edf7ed')}{summaryCard('Avance promedio', roadmapAverage + '%', '#f7eafa')}{summaryCard('Completadas', filteredRoadmap.filter((m) => m.estado === 'Completada').length, '#fff2e7')}{summaryCard('Críticas pendientes', filteredRoadmap.filter((m) => m.prioridad === 'Crítica' && m.estado !== 'Completada').length, '#ffebed')}</div>
      <div style={chartGrid}><ChartPanel title="Mejoras por estado" values={countBy(filteredRoadmap, (m) => m.estado)} onPick={(name) => setStatus(name)}/><ChartPanel title="Mejoras por sección" values={countBy(filteredRoadmap, (m) => m.seccion)} onPick={(name) => setArea(name)}/><div style={panelStyle}><strong style={{ fontSize: 12 }}>Detalle del roadmap · solo lectura</strong>{filteredRoadmap.slice(0, 20).map((m, index) => <div key={String(m.id ?? index)} style={{ ...linkStyle, cursor: 'default' }}><span>{m.nombre}</span><b>{roadmapProgress[m.estado] ?? 0}%</b></div>)}</div></div>
    </>}
    <p style={{ fontSize: 10, color: '#8790a5', margin: 0 }}>Proyectos ITM: datos en vivo del espacio local actual. Roadmap: copia importada por JSON, solo lectura; no se sincroniza automáticamente. Las demás pantallas y el menú original no cambian.</p>
  </section>;
}
