-- AuditSys Mini. Run in the Supabase SQL editor or with `supabase db push`.
create extension if not exists pgcrypto;

create type public.app_role as enum ('ADMINISTRADOR','AUDITOR','CONSULTOR');
create type public.audit_status as enum ('PLANIFICADA','EN_EJECUCION','EN_REVISION','FINALIZADA','CANCELADA');
create type public.control_category as enum ('ORGANIZACIONAL','PERSONAS','FISICO','TECNOLOGICO');
create type public.evaluation_status as enum ('IMPLEMENTADO','PARCIALMENTE_IMPLEMENTADO','NO_IMPLEMENTADO','NO_APLICABLE');
create type public.evidence_type as enum ('DOCUMENTO','CAPTURA','REGISTRO','ENTREVISTA','OBSERVACION','REFERENCIA','OTRO');
create type public.finding_severity as enum ('CRITICA','ALTA','MEDIA','BAJA');
create type public.finding_status as enum ('ABIERTO','EN_TRATAMIENTO','EN_REVISION','CERRADO');
create type public.recommendation_status as enum ('PENDIENTE','EN_PROCESO','IMPLEMENTADA','VERIFICADA');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', email text not null,
  role public.app_role not null default 'AUDITOR', created_at timestamptz not null default now()
);
create table public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null,
  description text not null default '', sector text not null default '',
  created_at timestamptz not null default now()
);
create table public.audits (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  name text not null, description text not null default '', objective text not null,
  scope text not null, start_date date not null, end_date date not null,
  responsible_id uuid not null references public.profiles(id), audit_type text not null default 'Interna',
  status public.audit_status not null default 'PLANIFICADA',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint audit_dates check (end_date >= start_date)
);
create table public.controls (
  id uuid primary key default gen_random_uuid(), code text not null,
  version integer not null default 1 check (version > 0), name text not null,
  description text not null, objective text not null default '',
  category public.control_category not null, standard_source text not null,
  evaluation_criteria text not null, active boolean not null default true,
  created_at timestamptz not null default now(), unique(code,version)
);
create unique index controls_one_active_code on public.controls(code) where active;
create table public.audit_controls (
  id uuid primary key default gen_random_uuid(), audit_id uuid not null references public.audits(id),
  control_id uuid not null references public.controls(id), created_at timestamptz not null default now(),
  unique(audit_id,control_id)
);
create table public.evaluations (
  id uuid primary key default gen_random_uuid(), audit_id uuid not null,
  control_id uuid not null, status public.evaluation_status not null,
  observations text not null default '', justification text not null default '',
  evaluator_id uuid not null references public.profiles(id), evaluated_at date not null default current_date,
  updated_at timestamptz not null default now(),
  unique(audit_id,control_id),
  foreign key(audit_id,control_id) references public.audit_controls(audit_id,control_id),
  constraint na_reason check (status <> 'NO_APLICABLE' or length(trim(justification)) > 0)
);
create table public.evidences (
  id uuid primary key default gen_random_uuid(), audit_id uuid not null, control_id uuid not null,
  evaluation_id uuid references public.evaluations(id) on delete set null,
  name text not null, description text not null default '', evidence_type public.evidence_type not null,
  source text not null default '', obtained_at date not null default current_date,
  file_path text, external_reference text, mime_type text, file_size bigint,
  is_simulated boolean not null default false,
  registered_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  foreign key(audit_id,control_id) references public.audit_controls(audit_id,control_id),
  constraint evidence_reference check (file_path is not null or external_reference is not null)
);
create table public.findings (
  id uuid primary key default gen_random_uuid(), audit_id uuid not null, control_id uuid not null,
  code text not null, title text not null, condition text not null, criteria text not null,
  cause text not null default '', effect text not null default '',
  severity public.finding_severity not null, status public.finding_status not null default 'ABIERTO',
  responsible_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(audit_id,code), foreign key(audit_id,control_id) references public.audit_controls(audit_id,control_id)
);
create table public.finding_evidences (
  id uuid primary key default gen_random_uuid(), finding_id uuid not null references public.findings(id) on delete cascade,
  evidence_id uuid not null references public.evidences(id), unique(finding_id,evidence_id)
);
create table public.recommendations (
  id uuid primary key default gen_random_uuid(), finding_id uuid not null references public.findings(id),
  title text not null, description text not null default '', suggested_action text not null,
  proposed_responsible text not null default '', target_date date,
  priority public.finding_severity not null default 'MEDIA',
  status public.recommendation_status not null default 'PENDIENTE',
  created_at timestamptz not null default now()
);
create table public.audit_reports (
  id uuid primary key default gen_random_uuid(), audit_id uuid not null references public.audits(id),
  generated_by uuid not null references public.profiles(id), report_version integer not null,
  generated_at timestamptz not null default now(), conclusions text not null,
  snapshot_data jsonb not null, unique(audit_id,report_version)
);
create table public.audit_activity (
  id uuid primary key default gen_random_uuid(), audit_id uuid references public.audits(id),
  user_id uuid references public.profiles(id), action text not null, entity_type text not null,
  entity_id uuid, created_at timestamptz not null default now()
);

create index audits_org_status on public.audits(organization_id,status);
create index audits_responsible on public.audits(responsible_id);
create index audit_controls_audit on public.audit_controls(audit_id);
create index evaluations_audit on public.evaluations(audit_id,status);
create index evidences_audit on public.evidences(audit_id,control_id);
create index findings_audit on public.findings(audit_id,severity,status);
create index recommendations_finding on public.recommendations(finding_id);
create index reports_audit on public.audit_reports(audit_id,generated_at desc);
create index activity_recent on public.audit_activity(created_at desc);

create function public.current_role() returns public.app_role language sql stable security definer
set search_path = public as $$ select role from public.profiles where id = auth.uid() $$;
create function public.can_write() returns boolean language sql stable security definer
set search_path = public as $$ select public.current_role() in ('ADMINISTRADOR','AUDITOR') $$;
create function public.is_admin() returns boolean language sql stable security definer
set search_path = public as $$ select public.current_role() = 'ADMINISTRADOR' $$;
revoke all on function public.current_role() from public;
revoke all on function public.can_write() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_role(),public.can_write(),public.is_admin() to authenticated;

create function public.new_profile() returns trigger language plpgsql security definer
set search_path = public as $$
begin
 insert into public.profiles(id,email,full_name) values(new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'full_name',''));
 return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.new_profile();
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;
create trigger audits_touch before update on public.audits for each row execute function public.touch_updated_at();
create trigger evaluations_touch before update on public.evaluations for each row execute function public.touch_updated_at();
create trigger findings_touch before update on public.findings for each row execute function public.touch_updated_at();

create function public.guard_audit_status() returns trigger language plpgsql as $$
begin
 if old.status = new.status then return new; end if;
 if (old.status='PLANIFICADA' and new.status in ('EN_EJECUCION','CANCELADA')) or
    (old.status='EN_EJECUCION' and new.status in ('EN_REVISION','CANCELADA')) or
    (old.status='EN_REVISION' and new.status in ('EN_EJECUCION','FINALIZADA','CANCELADA'))
 then return new; end if;
 raise exception 'Transición de estado no permitida: % -> %',old.status,new.status;
end $$;
create trigger audit_status_guard before update of status on public.audits for each row execute function public.guard_audit_status();

create function public.guard_relation() returns trigger language plpgsql as $$
declare a uuid; c uuid;
begin
 if tg_table_name='evidences' and new.evaluation_id is not null then
   select audit_id,control_id into a,c from public.evaluations where id=new.evaluation_id;
   if a is distinct from new.audit_id or c is distinct from new.control_id then raise exception 'La evaluación no corresponde al control de la auditoría'; end if;
 elsif tg_table_name='finding_evidences' then
   select audit_id,control_id into a,c from public.findings where id=new.finding_id;
   if not exists (select 1 from public.evidences where id=new.evidence_id and audit_id=a and control_id=c) then
     raise exception 'La evidencia no corresponde al hallazgo'; end if;
 end if;
 return new;
end $$;
create trigger evidence_relation before insert or update on public.evidences for each row execute function public.guard_relation();
create trigger finding_evidence_relation before insert or update on public.finding_evidences for each row execute function public.guard_relation();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.audits enable row level security;
alter table public.controls enable row level security;
alter table public.audit_controls enable row level security;
alter table public.evaluations enable row level security;
alter table public.evidences enable row level security;
alter table public.findings enable row level security;
alter table public.finding_evidences enable row level security;
alter table public.recommendations enable row level security;
alter table public.audit_reports enable row level security;
alter table public.audit_activity enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy organizations_read on public.organizations for select to authenticated using (true);
create policy organizations_write on public.organizations for all to authenticated using (public.can_write()) with check (public.can_write());
create policy audits_read on public.audits for select to authenticated using (true);
create policy audits_write on public.audits for all to authenticated using (public.can_write()) with check (public.can_write());
create policy controls_read on public.controls for select to authenticated using (true);
create policy controls_admin on public.controls for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy audit_controls_read on public.audit_controls for select to authenticated using (true);
create policy audit_controls_write on public.audit_controls for all to authenticated using (public.can_write()) with check (public.can_write());
create policy evaluations_read on public.evaluations for select to authenticated using (true);
create policy evaluations_write on public.evaluations for all to authenticated using (public.can_write()) with check (public.can_write());
create policy evidences_read on public.evidences for select to authenticated using (true);
create policy evidences_write on public.evidences for all to authenticated using (public.can_write()) with check (public.can_write());
create policy findings_read on public.findings for select to authenticated using (true);
create policy findings_write on public.findings for all to authenticated using (public.can_write()) with check (public.can_write());
create policy finding_evidences_read on public.finding_evidences for select to authenticated using (true);
create policy finding_evidences_write on public.finding_evidences for all to authenticated using (public.can_write()) with check (public.can_write());
create policy recommendations_read on public.recommendations for select to authenticated using (true);
create policy recommendations_write on public.recommendations for all to authenticated using (public.can_write()) with check (public.can_write());
create policy reports_read on public.audit_reports for select to authenticated using (true);
create policy reports_insert on public.audit_reports for insert to authenticated with check (public.can_write() and generated_by=auth.uid());
create policy activity_read on public.audit_activity for select to authenticated using (true);
-- Activity rows are written by database triggers, not by browser/API clients.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('audit-evidence','audit-evidence',false,10485760,array['application/pdf','image/png','image/jpeg','text/plain'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
-- No authenticated storage policies: only server routes holding the service role
-- can upload, remove or issue short-lived signed URLs after application checks.

-- Destructive removal is explicit and allowed only for an administrator or the responsible auditor.
create function public.delete_audit_tree(p_audit uuid) returns void language plpgsql security definer
set search_path = public as $$
begin
 if not public.can_write() or not exists(select 1 from public.audits where id=p_audit and (responsible_id=auth.uid() or public.is_admin())) then
   raise exception 'No autorizado';
 end if;
 delete from public.finding_evidences where finding_id in(select id from public.findings where audit_id=p_audit);
 delete from public.recommendations where finding_id in(select id from public.findings where audit_id=p_audit);
 delete from public.findings where audit_id=p_audit;
 delete from public.evidences where audit_id=p_audit;
 delete from public.evaluations where audit_id=p_audit;
 delete from public.audit_reports where audit_id=p_audit;
 delete from public.audit_activity where audit_id=p_audit;
 delete from public.audit_controls where audit_id=p_audit;
 delete from public.audits where id=p_audit;
end $$;
revoke all on function public.delete_audit_tree(uuid) from public;
grant execute on function public.delete_audit_tree(uuid) to authenticated;
