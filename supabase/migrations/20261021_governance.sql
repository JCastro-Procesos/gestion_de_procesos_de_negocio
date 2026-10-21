-- ITM Project Hub / Bloque 4: aplicar en Supabase SQL Editor.
-- Requiere habilitar el proveedor Azure (Microsoft Entra ID) en Supabase Auth.
create extension if not exists pgcrypto;
create table if not exists public.itm_memberships (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'consulta' check (role in ('admin','gerencia','especialista','responsable','consulta')),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.itm_workspace (
 id text primary key default 'itm',
 payload jsonb not null,
 revision bigint not null default 1,
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now()
);
create table if not exists public.itm_governance (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('solicitud','entregable','cambio')),
 project_id text,
 title text not null,
 description text not null default '',
 severity text not null default 'menor' check (severity in ('menor','mayor','critico')),
 status text not null default 'pendiente' check (status in ('pendiente','aprobado','rechazado','devuelto')),
 requester uuid not null references auth.users(id),
 reviewer uuid references auth.users(id),
 decision_note text not null default '',
 created_at timestamptz not null default now(),
 decided_at timestamptz
);
create table if not exists public.itm_audit (
 id bigint generated always as identity primary key,
 actor uuid not null references auth.users(id),
 entity text not null,
 entity_id text not null,
 action text not null,
 old_data jsonb,
 new_data jsonb,
 happened_at timestamptz not null default now()
);
create or replace function public.itm_role() returns text language sql stable security definer set search_path=public as $$
 select role from public.itm_memberships where user_id=auth.uid() and active=true
$$;
create or replace function public.itm_can_edit() returns boolean language sql stable as $$
 select coalesce(public.itm_role() in ('admin','gerencia','especialista'),false)
$$;
alter table public.itm_memberships enable row level security;
alter table public.itm_workspace enable row level security;
alter table public.itm_governance enable row level security;
alter table public.itm_audit enable row level security;
create policy "member reads self" on public.itm_memberships for select to authenticated using (user_id=auth.uid() or public.itm_role()='admin');
create policy "admin manages memberships" on public.itm_memberships for all to authenticated using (public.itm_role()='admin') with check (public.itm_role()='admin');
create policy "members read workspace" on public.itm_workspace for select to authenticated using (public.itm_role() is not null);
create policy "editors create workspace" on public.itm_workspace for insert to authenticated with check (public.itm_can_edit() and updated_by=auth.uid());
create policy "editors update workspace" on public.itm_workspace for update to authenticated using (public.itm_can_edit()) with check (public.itm_can_edit() and updated_by=auth.uid());
create policy "members read governance" on public.itm_governance for select to authenticated using (public.itm_role() is not null);
create policy "members request" on public.itm_governance for insert to authenticated with check (public.itm_role() is not null and requester=auth.uid() and status='pendiente' and reviewer is null and decided_at is null);
create policy "reviewers decide" on public.itm_governance for update to authenticated using (public.itm_role() in ('admin','gerencia')) with check (public.itm_role() in ('admin','gerencia'));
create policy "members read audit" on public.itm_audit for select to authenticated using (public.itm_role() in ('admin','gerencia'));
-- Restringir escritura de auditoría a triggers SECURITY DEFINER.
revoke insert, update, delete, truncate on public.itm_audit from anon, authenticated;
-- No INSERT/UPDATE/DELETE grants for audit: immutable from browser.
create or replace function public.itm_audit_changes() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.itm_audit(actor,entity,entity_id,action,old_data,new_data)
 values (auth.uid(),TG_TABLE_NAME,coalesce(new.id::text,old.id::text),TG_OP,to_jsonb(old),to_jsonb(new));
 return coalesce(new,old);
end $$;
create or replace function public.itm_protect_governance() returns trigger language plpgsql security definer set search_path=public as $
begin
 if TG_OP='UPDATE' then
  if new.requester is distinct from old.requester or new.kind is distinct from old.kind or new.project_id is distinct from old.project_id or new.created_at is distinct from old.created_at then
   raise exception 'Campos de solicitud inmutables';
  end if;
  if new.status is distinct from old.status and old.status not in ('pendiente','devuelto') then
   raise exception 'Decisión final no puede modificarse';
  end if;
  if new.status in ('aprobado','rechazado') then
   new.reviewer:=auth.uid();new.decided_at:=now();
  end if;
 end if;
 return new;
end $;
create trigger itm_governance_protect before update on public.itm_governance for each row execute function public.itm_protect_governance();
create trigger itm_workspace_audit after insert or update or delete on public.itm_workspace for each row execute function public.itm_audit_changes();
create trigger itm_governance_audit after insert or update or delete on public.itm_governance for each row execute function public.itm_audit_changes();
-- IMPORTANTE: establecer el primer administrador desde SQL Editor, nunca desde el navegador:
-- insert into public.itm_memberships(user_id,role) values ('UUID-DEL-USUARIO','admin');
-- No almacenar service_role key en Vite/GitHub Pages.
