import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, BarChart3, BookOpen, ChevronDown, ClipboardList, Database, FolderKanban, Gauge, Plus, ShieldAlert, UsersRound } from 'lucide-react';
import type { GraphSettings, Project, RaidItem, Stage, Task, TeamMember, Workspace } from '../domain/model';
import { createStages } from '../domain/methodologies';
import { ErrorBanner, Toast } from '../components/ui';
import { useWorkspace } from './useWorkspace';
import { DEMO_WORKSPACE } from '../data/demo';
import { createEmptyWorkspace } from '../data/storage';
import { importCsv, importJson } from '../data/exchange';

const Dashboard = lazy(() => import('../features/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })));
const ProjectsPage = lazy(() => import('../features/projects/ProjectsPage').then((module) => ({ default: module.ProjectsPage })));
const TasksPage = lazy(() => import('../features/tasks/TasksPage').then((module) => ({ default: module.TasksPage })));
const TeamPage = lazy(() => import('../features/team/TeamPage').then((module) => ({ default: module.TeamPage })));
const RaidPage = lazy(() => import('../features/raid/RaidPage').then((module) => ({ default: module.RaidPage })));
const MethodologiesPage = lazy(() => import('../features/methodologies/MethodologiesPage').then((module) => ({ default: module.MethodologiesPage })));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const DataPage = lazy(() => import('../features/data/DataPage').then((module) => ({ default: module.DataPage })));
const GovernancePage = lazy(() => import('../features/governance/GovernancePage').then((module) => ({ default: module.GovernancePage })));
const IntegrationsPage = lazy(() => import('../features/integrations/IntegrationsPage').then((module) => ({ default: module.IntegrationsPage })));

const NAV = [
  { id: 'dashboard', label: 'Panel ejecutivo', icon: Gauge, group: 'Espacio de trabajo' },
  { id: 'proyectos', label: 'Proyectos', icon: FolderKanban },
  { id: 'tareas', label: 'Tareas', icon: ClipboardList, count: 'tasks' },
  { id: 'equipo', label: 'Equipo y capacidad', icon: UsersRound },
  { id: 'raid', label: 'Riesgos y decisiones', icon: ShieldAlert, count: 'raid' },
  { id: 'reportes', label: 'KPIs y reportes', icon: BarChart3, group: 'Control' },
  { id: 'metodologias', label: 'Metodologías', icon: BookOpen },
  { id: 'gobierno', label: 'Gobierno y autorizaciones', icon: ShieldAlert },
  { id: 'datos', label: 'Datos e intercambio', icon: Database, group: 'Configuración' },
  { id: 'integraciones', label: 'Microsoft 365', icon: ArrowLeftRight },
] as const;
const PAGE_TITLES: Record<string, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: 'ITM GROUP / PROCESOS DE NEGOCIO', title: 'Panel ejecutivo' },
  proyectos: { eyebrow: 'PORTAFOLIO / INICIATIVAS', title: 'Gestión de proyectos' },
  tareas: { eyebrow: 'EJECUCIÓN / TRABAJO DEL EQUIPO', title: 'Gestión de tareas' },
  equipo: { eyebrow: 'RECURSOS / DISPONIBILIDAD', title: 'Equipo y capacidad' },
  raid: { eyebrow: 'GOBIERNO / REGISTRO RAID', title: 'Riesgos y decisiones' },
  reportes: { eyebrow: 'SEGUIMIENTO / RESULTADOS', title: 'KPIs y reportes' },
  metodologias: { eyebrow: 'CONSULTORÍA / MÉTODOS ITM', title: 'Catálogo metodológico' },
  gobierno: { eyebrow: 'GOBIERNO / AUTORIZACIONES', title: 'Gobierno y autorizaciones' },
  datos: { eyebrow: 'ADMINISTRACIÓN / RESPALDOS', title: 'Datos e intercambio' },
  integraciones: { eyebrow: 'CONECTORES / MICROSOFT GRAPH', title: 'Integraciones Microsoft 365' },
};

export function App() {
  const { workspace, update, replace, storageError } = useWorkspace();
  const [page, setPage] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [pendingNewProject, setPendingNewProject] = useState(false);
  const [pendingTask, setPendingTask] = useState<{ projectId: string; stageId: string } | null>(null);
  const [pendingRaidProject, setPendingRaidProject] = useState<string | undefined>();
  const [toastMessage, setToastMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const [clockOwner, setClockOwner] = useState('Equipo ITM');
  const flash = useCallback((message: string) => setToastMessage(message), []);

  useEffect(() => {
    if (!workspace.tasks.some((task) => task.timerStartedAt)) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [workspace.tasks]);

  const navigate = useCallback((next: string) => { setPage(next); setSelectedProjectId(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);
  const openProject = useCallback((id: string) => { setSelectedProjectId(id); setPage('proyectos'); window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  const saveProject = (project: Project, mode: 'Express' | 'Estándar' | 'Transformación', isNew: boolean) => {
    update((current) => {
      const next = { ...current, projects: isNew ? [project, ...current.projects] : current.projects.map((item) => item.id === project.id ? project : item) };
      if (isNew) next.stages = [...next.stages, ...createStages(project.id, project.startDate, project.dueDate, current.members, mode)];
      return next;
    });
  };
  const deleteProject = (projectId: string) => {
    update((current) => ({ ...current, projects: current.projects.filter((project) => project.id !== projectId), stages: current.stages.filter((stage) => stage.projectId !== projectId), tasks: current.tasks.filter((task) => task.projectId !== projectId), raids: current.raids.filter((item) => item.projectId !== projectId) }));
    setSelectedProjectId(null);
  };
  const updateStage = (stage: Stage) => update((current) => ({ ...current, stages: current.stages.map((item) => item.id === stage.id ? stage : item) }));
  const addActivity = (stage: Stage, activity: Stage['activities'][number]) => update((current) => ({ ...current, stages: current.stages.map((item) => item.id === stage.id ? { ...item, activities: [...item.activities, activity] } : item) }));
  const updateActivity = (stage: Stage, activity: Stage['activities'][number]) => update((current) => ({ ...current, stages: current.stages.map((item) => item.id === stage.id ? { ...item, activities: item.activities.map((old) => old.id === activity.id ? activity : old) } : item) }));

  const saveTask = (task: Task, isNew: boolean) => update((current) => ({ ...current, tasks: isNew ? [task, ...current.tasks] : current.tasks.map((item) => item.id === task.id ? task : item) }));
  const deleteTask = (id: string) => update((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id), timeLogs: current.timeLogs.filter((log) => log.taskId !== id) }));
  const toggleSubtask = (taskId: string, subtaskId: string) => update((current) => ({ ...current, tasks: current.tasks.map((task) => task.id !== taskId ? task : { ...task, subtasks: task.subtasks.map((subtask) => subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask) }) }));

  const stopTimer = (current: Workspace, task: Task, endAt: Date): Workspace => {
    if (!task.timerStartedAt) return current;
    const start = new Date(task.timerStartedAt);
    const seconds = Math.max(1, Math.floor((endAt.getTime() - start.getTime()) / 1000));
    const hours = seconds / 3600;
    const memberId = task.assigneeId || current.projects.find((project) => project.id === task.projectId)?.ownerId || '';
    return {
      ...current,
      tasks: current.tasks.map((item) => item.id === task.id ? { ...item, actualHours: Number((item.actualHours + hours).toFixed(2)), timerStartedAt: undefined } : item),
      timeLogs: [...current.timeLogs, { id: `time-${crypto.randomUUID()}`, taskId: task.id, memberId, startedAt: start.toISOString(), endedAt: endAt.toISOString(), seconds, source: 'Temporizador', note: '' }],
    };
  };
  const timerAction = (task: Task) => {
    const at = new Date();
    update((current) => {
      const target = current.tasks.find((item) => item.id === task.id);
      if (target?.timerStartedAt) return stopTimer(current, target, at);
      let next = current;
      current.tasks.filter((item) => item.timerStartedAt && item.id !== task.id).forEach((running) => { next = stopTimer(next, running, at); });
      return { ...next, tasks: next.tasks.map((item) => item.id === task.id ? { ...item, timerStartedAt: at.toISOString() } : item) };
    });
    setClockOwner(task.title);
    flash(task.timerStartedAt ? 'Temporizador detenido y horas guardadas' : 'Temporizador iniciado');
  };

  const saveRaid = (item: RaidItem, isNew: boolean) => update((current) => ({ ...current, raids: isNew ? [item, ...current.raids] : current.raids.map((old) => old.id === item.id ? item : old) }));
  const saveMember = (member: TeamMember) => update((current) => ({ ...current, members: current.members.some((item) => item.id === member.id) ? current.members.map((item) => item.id === member.id ? member : item) : [...current.members, member] }));
  const saveGraphSettings = (settings: GraphSettings) => update((current) => ({ ...current, graphSettings: settings }));
  const saveGraphAccount = (name: string, accountId: string) => update((current) => ({ ...current, graphConnectedName: name, graphAccountId: accountId }));

  const importFile = async (file: File, mode: 'merge' | 'replace') => {
    if (mode === 'replace' && !window.confirm('Reemplazar eliminará los datos actuales que no estén en el archivo. ¿Descargaste un respaldo y quieres continuar?')) throw new Error('Importación cancelada; no se modificaron los datos.');
    const text = await file.text();
    let next: Workspace; let message: string;
    if (file.name.toLowerCase().endsWith('.csv')) {
      const base = mode === 'replace' ? createEmptyWorkspace() : workspace;
      const result = importCsv(text, base);
      next = result.workspace; message = result.message;
    } else {
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { throw new Error('El archivo no es un JSON válido.'); }
      const result = importJson(parsed, workspace, mode);
      next = result.workspace; message = result.message;
    }
    replace(next);
    return message;
  };

  const header = PAGE_TITLES[page] || PAGE_TITLES.dashboard;
  const navCount = (key: string) => key === 'tasks' ? workspace.tasks.filter((task) => task.status !== 'Completado').length : workspace.raids.filter((item) => item.status !== 'Cerrado').length;

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-symbol"><span/><span/><span/><span/></span><span className="brand-copy"><b>ITM <em>PROJECT HUB</em></b><small>PROCESOS DE NEGOCIO</small></span></div><div className="workspace-switcher"><span className="workspace-avatar">IT</span><span><small>ESPACIO DE TRABAJO</small><b>{workspace.workspaceName}</b></span><ChevronDown size={14}/></div><nav className="side-nav" aria-label="Navegación principal">{NAV.map((item, index) => { const Icon = item.icon; return <div key={item.id}>{'group' in item && item.group && <div className={`nav-group-label ${index === 0 ? 'first-group' : ''}`}>{item.group}</div>}<button className={`nav-link ${page === item.id ? 'nav-active' : ''}`} onClick={() => navigate(item.id)}><Icon size={17}/><span>{item.label}</span>{'count' in item && navCount(item.count) > 0 && <b className="nav-count">{navCount(item.count)}</b>}</button></div>; })}</nav><div className="sidebar-spacer"/><div className="sidebar-footer"><div className="local-status"><span/><span><b>Espacio local</b><small>Guardado en este navegador</small></span></div><button onClick={() => navigate('integraciones')}><ArrowLeftRight size={14}/> Conectar Microsoft 365</button><div className="sidebar-version">ITM PROJECT HUB <span>·</span> v1.0</div></div></aside>
    <main className="main-area"><header className="topbar"><div className="topbar-context"><div className="mobile-mark"><span className="brand-symbol"><span/><span/><span/><span/></span></div><div><span className="eyebrow">{header.eyebrow}</span><h1>{header.title}</h1></div></div><div className="topbar-actions"><div className="last-sync"><span/><span><b>Guardado local</b><small>{new Date().toLocaleDateString('es-MX',{day:'numeric',month:'short'})}</small></span></div><button className="top-add-button" onClick={() => { setPendingNewProject(true); navigate('proyectos'); }}><Plus size={15}/> Nuevo proyecto</button><button className="avatar-user" title={clockOwner}><span>IT</span></button></div></header><div className="main-content"><ErrorBanner text={storageError}/><Suspense fallback={<div className="page-loading"><span/>Cargando módulo…</div>}>{page === 'dashboard' && <Dashboard workspace={workspace} onOpenProject={openProject} onNavigate={navigate}/>} {page === 'proyectos' && <ProjectsPage workspace={workspace} selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} onSaveProject={saveProject} onDeleteProject={deleteProject} onUpdateStage={updateStage} onAddActivity={addActivity} onUpdateActivity={updateActivity} onAddTask={(projectId,stageId) => { setPendingTask({projectId,stageId}); navigate('tareas'); }} onOpenRaid={(projectId) => { setPendingRaidProject(projectId); navigate('raid'); }} toast={flash} openNewProject={pendingNewProject} clearNewProject={() => setPendingNewProject(false)}/>} {page === 'tareas' && <TasksPage workspace={workspace} onSaveTask={saveTask} onDeleteTask={deleteTask} onToggleSubtask={toggleSubtask} onTimer={timerAction} now={now} initialProjectId={pendingTask?.projectId} initialStageId={pendingTask?.stageId} clearInitialSelection={() => setPendingTask(null)} toast={flash}/>} {page === 'equipo' && <TeamPage workspace={workspace} onSaveMember={saveMember} toast={flash}/>} {page === 'raid' && <RaidPage workspace={workspace} onSave={saveRaid} onDelete={(id) => update((current) => ({ ...current, raids: current.raids.filter((item) => item.id !== id) }))} toast={flash} initialProjectId={pendingRaidProject} clearInitialProject={() => setPendingRaidProject(undefined)}/>} {page === 'reportes' && <ReportsPage workspace={workspace}/>} {page === 'metodologias' && <MethodologiesPage onNavigate={() => navigate('proyectos')} workspace={workspace} onSaveTask={saveTask}/>} {page === 'gobierno' && <GovernancePage workspace={workspace}/>} {page === 'datos' && <DataPage workspace={workspace} onImportFile={importFile} onEmpty={() => replace(createEmptyWorkspace())} onLoadDemo={() => replace(structuredClone(DEMO_WORKSPACE))} toast={flash}/>} {page === 'integraciones' && <IntegrationsPage workspace={workspace} onSaveSettings={saveGraphSettings} onConnection={saveGraphAccount} onUpdateTask={(task) => saveTask(task,false)} onUpdateProject={(project) => update((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? project : item) }))} toast={flash}/>}</Suspense></div><footer className="main-footer"><span>ITM GROUP · GESTIÓN DE PROYECTOS Y PROCESOS</span><span><span className="footer-dot"/> Entorno de demostración editable</span></footer></main><Toast message={toastMessage} onClose={() => setToastMessage('')}/></div>;
}
