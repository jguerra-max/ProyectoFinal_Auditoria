-- Atomic versioning and evidence links. Historical rows remain immutable.
create function public.version_control(p_control uuid,p_data jsonb) returns public.controls
language plpgsql security definer set search_path=public as $$
declare old_row public.controls; new_row public.controls;
begin
 if not public.is_admin() then raise exception 'No autorizado'; end if;
 select * into old_row from public.controls where id=p_control for update;
 if old_row.id is null then raise exception 'Control no encontrado'; end if;
 if old_row.version <> (select max(version) from public.controls where code=old_row.code) then raise exception 'Solo se puede editar la versión más reciente'; end if;
 if p_data->>'code' is distinct from old_row.code then raise exception 'El identificador del control no puede cambiar'; end if;
 update public.controls set active=false where id=p_control;
 insert into public.controls(code,version,name,description,objective,category,standard_source,evaluation_criteria,active)
 values(old_row.code,old_row.version+1,p_data->>'name',p_data->>'description',coalesce(p_data->>'objective',''),
 (p_data->>'category')::public.control_category,p_data->>'standard_source',p_data->>'evaluation_criteria',coalesce((p_data->>'active')::boolean,false))
 returning * into new_row;
 return new_row;
end $$;
revoke all on function public.version_control(uuid,jsonb) from public;
grant execute on function public.version_control(uuid,jsonb) to authenticated;

create function public.set_finding_evidences(p_finding uuid,p_ids uuid[]) returns void
language plpgsql security definer set search_path=public as $$
declare f public.findings; evidence_id uuid;
begin
 if not public.can_write() then raise exception 'No autorizado'; end if;
 select * into f from public.findings where id=p_finding;
 if f.id is null then raise exception 'Hallazgo no encontrado'; end if;
 foreach evidence_id in array p_ids loop
   if not exists(select 1 from public.evidences where id=evidence_id and audit_id=f.audit_id and control_id=f.control_id)
   then raise exception 'Evidencia ajena al control del hallazgo'; end if;
 end loop;
 delete from public.finding_evidences where finding_id=p_finding;
 insert into public.finding_evidences(finding_id,evidence_id)
 select p_finding,x.evidence_id from unnest(p_ids) as x(evidence_id) group by x.evidence_id;
end $$;
revoke all on function public.set_finding_evidences(uuid,uuid[]) from public;
grant execute on function public.set_finding_evidences(uuid,uuid[]) to authenticated;

create function public.prevent_duplicate_control_code() returns trigger language plpgsql as $$
begin
 if exists(select 1 from public.audit_controls ac join public.controls existing on existing.id=ac.control_id
           join public.controls incoming on incoming.id=new.control_id
           where ac.audit_id=new.audit_id and existing.code=incoming.code and ac.id<>new.id)
 then raise exception 'Ya existe una versión de ese control en la auditoría'; end if;
 return new;
end $$;
create trigger audit_control_code_guard before insert or update on public.audit_controls
for each row execute function public.prevent_duplicate_control_code();

create function public.require_planned_audit() returns trigger language plpgsql as $$
begin
 if new.status <> 'PLANIFICADA' then raise exception 'Una auditoría nueva debe comenzar como Planificada'; end if;
 return new;
end $$;
create trigger audit_initial_status before insert on public.audits for each row execute function public.require_planned_audit();

create function public.log_audit_change() returns trigger language plpgsql security definer
set search_path=public as $$
declare related_audit uuid;
begin
 if tg_table_name='audits' then related_audit=new.id;
 elsif tg_table_name='recommendations' then select audit_id into related_audit from public.findings where id=new.finding_id;
 else related_audit=new.audit_id;
 end if;
 insert into public.audit_activity(audit_id,user_id,action,entity_type,entity_id)
 values(related_audit,auth.uid(),case when tg_op='INSERT' then 'Registro creado' else 'Registro actualizado' end,tg_table_name,new.id);
 return new;
end $$;
create trigger audits_activity after insert or update on public.audits for each row execute function public.log_audit_change();
create trigger audit_controls_activity after insert or update on public.audit_controls for each row execute function public.log_audit_change();
create trigger evaluations_activity after insert or update on public.evaluations for each row execute function public.log_audit_change();
create trigger evidences_activity after insert or update on public.evidences for each row execute function public.log_audit_change();
create trigger findings_activity after insert or update on public.findings for each row execute function public.log_audit_change();
create trigger recommendations_activity after insert or update on public.recommendations for each row execute function public.log_audit_change();
create trigger reports_activity after insert on public.audit_reports for each row execute function public.log_audit_change();
