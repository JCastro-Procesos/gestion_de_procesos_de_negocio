export type ProcessOneRole='admin'|'direccion'|'gerencia'|'especialista'|'ingeniero';
export const ROLE_LABELS:Record<ProcessOneRole,string>={admin:'Administrador',direccion:'Dirección',gerencia:'Gerencia',especialista:'Especialista',ingeniero:'Ingeniero'};
const level:Record<ProcessOneRole,number>={admin:5,direccion:4,gerencia:3,especialista:2,ingeniero:1};
export function canPerform(role:ProcessOneRole,minimum:ProcessOneRole){return level[role]>=level[minimum]}
export function publicRoleLabel(role:ProcessOneRole,viewerRole:ProcessOneRole){return role==='direccion'&&viewerRole!=='admin'?'':ROLE_LABELS[role]}
export const ANIMAL_AVATARS=['🦉','🦁','🐬','🦅','🦊','🐼','🐺','🐢','🐒','🐝'] as const;
