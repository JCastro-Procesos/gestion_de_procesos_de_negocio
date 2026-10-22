-- ProcessOne: aplicar en un proyecto Supabase nuevo/configurado antes de habilitar el login.
-- No ejecuta migraciones de datos locales ni reemplaza la migración anterior.
create extension if not exists pgcrypto;
create table if not exists public.processone_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (length(trim(display_name)) between 1 and 120),
 avatar_emoji text,
 avatar_url text,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.processone_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('admin','direccion','gerencia','especialista','ingeniero')),
 created_at timestamptz not null default now()
);
create or replace function public.processone_my_role() returns text language sql stable security definer set search_path='' as $$
 select r.role from public.processone_roles r join public.processone_profiles p on p.user_id=r.user_id
 where r.user_id=(select auth.uid()) and p.active=true
$$;
create or replace function public.processone_is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(public.processone_my_role()='admin',false)
$$;
create or replace function public.processone_can_manage_initiatives() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(public.processone_my_role() in ('admin','direccion','gerencia'),false)
$$;
create table if not exists public.processone_initiatives (
 id uuid primary key default gen_random_uuid(),
 title text not null check (length(trim(title)) between 1 and 120),
 objective text not null default '',
 status text not null default 'Planeada' check(status in ('Planeada','En ejecución','Completada','En riesgo')),
 owner_id uuid references auth.users(id),
 created_by uuid not null references auth.users(id) default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.processone_initiative_projects (
 initiative_id uuid not null references public.processone_initiatives(id) on delete cascade,
 project_id text not null,
 primary key (initiative_id,project_id)
);
alter table public.processone_profiles enable row level security;
alter table public.processone_roles enable row level security;
alter table public.processone_initiatives enable row level security;
alter table public.processone_initiative_projects enable row level security;
-- Usuarios autenticados activos ven nombres, avatares y estado, pero NUNCA la tabla de roles.
create policy "active members read profiles" on public.processone_profiles for select to authenticated
 using (public.processone_my_role() is not null);
create policy "admin inserts profiles" on public.processone_profiles for insert to authenticated
 with check (public.processone_is_admin());
create policy "admin updates profiles" on public.processone_profiles for update to authenticated
 using (public.processone_is_admin()) with check (public.processone_is_admin());
create policy "admin deletes profiles" on public.processone_profiles for delete to authenticated
 using (public.processone_is_admin());
create policy "admin reads roles" on public.processone_roles for select to authenticated
 using (public.processone_is_admin());
create policy "admin creates roles" on public.processone_roles for insert to authenticated
 with check (public.processone_is_admin());
create policy "admin updates roles" on public.processone_roles for update to authenticated
 using (public.processone_is_admin()) with check (public.processone_is_admin());
create policy "admin deletes roles" on public.processone_roles for delete to authenticated
 using (public.processone_is_admin());
create policy "members read initiatives" on public.processone_initiatives for select to authenticated
 using (public.processone_my_role() is not null);
create policy "managers create initiatives" on public.processone_initiatives for insert to authenticated
 with check (public.processone_can_manage_initiatives() and created_by=auth.uid());
create policy "managers update initiatives" on public.processone_initiatives for update to authenticated
 using (public.processone_can_manage_initiatives()) with check (public.processone_can_manage_initiatives());
create policy "managers delete initiatives" on public.processone_initiatives for delete to authenticated
 using (public.processone_can_manage_initiatives());
create policy "members read links" on public.processone_initiative_projects for select to authenticated
 using (public.processone_my_role() is not null);
create policy "managers insert links" on public.processone_initiative_projects for insert to authenticated
 with check (public.processone_can_manage_initiatives());
create policy "managers delete links" on public.processone_initiative_projects for delete to authenticated
 using (public.processone_can_manage_initiatives());
-- IMPORTANTE: provisionar auth.users mediante Supabase Admin API desde un backend seguro,
-- JAMÁS con service_role en el navegador. Crear primer admin desde SQL Editor.
-- Para avatares propios, configurar bucket privado y políticas por usuario antes de habilitar subida.
