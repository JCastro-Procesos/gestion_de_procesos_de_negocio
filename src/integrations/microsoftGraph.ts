import { BrowserCacheLocation, InteractionRequiredAuthError, PublicClientApplication, type AccountInfo, type AuthenticationResult } from '@azure/msal-browser';
import type { GraphSettings, Task } from '../domain/model';

const GRAPH = 'https://graph.microsoft.com/v1.0';
const SCOPES = ['User.Read', 'Calendars.ReadWrite', 'Tasks.ReadWrite'];
let client: PublicClientApplication | null = null;
let clientReady: Promise<void> | null = null;
let clientSettingsKey = '';
let activeAccount: AccountInfo | null = null;

function authority(settings: GraphSettings) {
  const tenant = settings.accountType === 'common' ? 'common' : settings.tenantId.trim();
  if (!tenant) throw new Error('Captura el identificador del tenant de Microsoft Entra.');
  return `https://login.microsoftonline.com/${tenant}`;
}

export function initializeGraph(settings: GraphSettings) {
  if (!settings.clientId.trim()) throw new Error('Captura el ID de aplicación (cliente) de Microsoft Entra.');
  if (!settings.redirectUri.trim()) throw new Error('Configura la URI de redirección registrada para la SPA.');
  if (new URL(settings.redirectUri).origin !== window.location.origin) throw new Error('La URI de redirección debe pertenecer al origen de esta aplicación.');
  const tenantAuthority = authority(settings);
  const settingsKey = `${settings.clientId.trim()}|${tenantAuthority}|${settings.redirectUri.trim()}`;
  if (client && clientSettingsKey === settingsKey && clientReady) return clientReady;
  const instance = new PublicClientApplication({
    auth: { clientId: settings.clientId.trim(), authority: tenantAuthority, redirectUri: settings.redirectUri.trim() },
    cache: { cacheLocation: BrowserCacheLocation.SessionStorage, storeAuthStateInCookie: false },
  });
  client = instance; clientSettingsKey = settingsKey;
  clientReady = instance.initialize().catch((error) => { if (client === instance) { client = null; clientReady = null; clientSettingsKey = ''; } throw error; });
  return clientReady;
}

function account() {
  if (!client) throw new Error('Configura Microsoft Entra antes de conectar.');
  activeAccount = client.getActiveAccount() ?? client.getAllAccounts()[0] ?? null;
  if (!activeAccount) throw new Error('No hay una cuenta Microsoft conectada.');
  return activeAccount;
}

export async function signInGraph(settings: GraphSettings): Promise<AccountInfo> {
  await initializeGraph(settings);
  if (!client) throw new Error('No se pudo inicializar MSAL.');
  const result: AuthenticationResult = await client.loginPopup({ scopes: SCOPES, prompt: 'select_account' });
  activeAccount = result.account;
  if (!activeAccount) throw new Error('Microsoft no devolvió una cuenta autenticada.');
  return activeAccount;
}

export async function signOutGraph(settings: GraphSettings) {
  if (!client) await initializeGraph(settings);
  if (!client) return;
  const selected = client.getActiveAccount() ?? client.getAllAccounts()[0];
  if (selected) await client.logoutPopup({ account: selected });
  activeAccount = null;
  client = null; clientReady = null; clientSettingsKey = '';
}

async function accessToken(settings: GraphSettings): Promise<string> {
  if (!client) await initializeGraph(settings);
  const user = account();
  try {
    return (await client!.acquireTokenSilent({ scopes: SCOPES, account: user })).accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) return (await client!.acquireTokenPopup({ scopes: SCOPES, account: user })).accessToken;
    throw error;
  }
}

async function graphRequest<T>(settings: GraphSettings, path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken(settings);
  const response = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string; code?: string } } | null;
    throw new Error(body?.error?.message || `Microsoft Graph respondió ${response.status} (${body?.error?.code ?? 'error'}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface GraphTodoList { id: string; displayName: string; isOwner: boolean; wellknownListName?: string }
export interface GraphCalendar { id: string; name: string; isDefaultCalendar?: boolean }

export async function listTodoLists(settings: GraphSettings): Promise<GraphTodoList[]> {
  const result = await graphRequest<{ value: GraphTodoList[] }>(settings, '/me/todo/lists?$select=id,displayName,isOwner,wellknownListName');
  return result.value;
}

export async function createTodoTask(settings: GraphSettings, listId: string, task: Task, projectName: string, assigneeName: string, taskPageUrl: string): Promise<{ id: string }> {
  const body = {
    title: task.title,
    body: { contentType: 'text', content: `${projectName}\nPrioridad: ${task.priority}\nResponsable: ${assigneeName || 'Sin asignar'}\n${task.description}\n\nAbrir en ITM Project Hub: ${taskPageUrl}` },
    importance: task.priority === 'Urgente' || task.priority === 'Alta' ? 'high' : task.priority === 'Baja' ? 'low' : 'normal',
    status: task.status === 'Completado' ? 'completed' : task.status === 'En Proceso' ? 'inProgress' : 'notStarted',
    ...(task.dueDate ? { dueDateTime: { dateTime: `${task.dueDate}T17:00:00`, timeZone: 'UTC' } } : {}),
  };
  return graphRequest(settings, `/me/todo/lists/${encodeURIComponent(listId)}/tasks`, { method: 'POST', body: JSON.stringify(body) });
}

export async function listCalendars(settings: GraphSettings): Promise<GraphCalendar[]> {
  const result = await graphRequest<{ value: GraphCalendar[] }>(settings, '/me/calendars?$select=id,name,isDefaultCalendar');
  return result.value;
}

export async function createCalendarEvent(settings: GraphSettings, calendarId: string, subject: string, dueDate: string, description: string, taskPageUrl: string): Promise<{ id: string; webLink?: string }> {
  const start = new Date(`${dueDate}T09:00:00`);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const body = {
    subject,
    body: { contentType: 'text', content: `${description}\n\nAbrir en ITM Project Hub: ${taskPageUrl}` },
    start: { dateTime: start.toISOString().replace('Z', ''), timeZone: 'UTC' },
    end: { dateTime: end.toISOString().replace('Z', ''), timeZone: 'UTC' },
    transactionId: crypto.randomUUID(),
  };
  return graphRequest(settings, `/me/calendars/${encodeURIComponent(calendarId)}/events`, { method: 'POST', body: JSON.stringify(body) });
}

export async function connectedAccountName(settings: GraphSettings): Promise<{ name: string; id: string }> {
  if (!client) await initializeGraph(settings);
  const user = account();
  const profile = await graphRequest<{ displayName?: string; mail?: string; userPrincipalName?: string }>(settings, '/me?$select=displayName,mail,userPrincipalName');
  return { name: profile.displayName || profile.mail || profile.userPrincipalName || user.name || user.username, id: user.homeAccountId };
}
