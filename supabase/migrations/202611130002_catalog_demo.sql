-- Resúmenes propios para la plataforma; no son texto oficial de ISO.
insert into public.controls(code,name,description,objective,category,standard_source,evaluation_criteria) values
('5.1','Políticas de seguridad de la información','Revisar que existan políticas aprobadas y comunicadas.','Orientar las prácticas de seguridad.','ORGANIZACIONAL','ISO/IEC 27002:2022','Políticas aprobadas, vigentes y comunicadas al personal pertinente.'),
('5.9','Inventario de información y activos asociados','Identificar los activos que soportan servicios y datos.','Conocer los activos dentro del alcance.','ORGANIZACIONAL','ISO/IEC 27002:2022','Inventario vigente, responsables asignados y revisión documentada.'),
('5.15','Control de acceso','Definir reglas para conceder y retirar accesos.','Restringir el acceso según necesidad.','ORGANIZACIONAL','ISO/IEC 27002:2022','Reglas de acceso, aprobaciones y revisiones periódicas disponibles.'),
('5.24','Planificación y preparación para incidentes','Definir cómo se gestionarán los incidentes de seguridad.','Preparar una respuesta coherente.','ORGANIZACIONAL','ISO/IEC 27002:2022','Procedimiento, responsables y canales de comunicación documentados.'),
('6.3','Concienciación y formación en seguridad','Promover formación pertinente a las funciones.','Reducir errores humanos evitables.','PERSONAS','ISO/IEC 27002:2022','Programa, registros de asistencia y contenido actualizado.'),
('6.7','Trabajo remoto','Definir condiciones de seguridad para el trabajo remoto.','Proteger información fuera de instalaciones.','PERSONAS','ISO/IEC 27002:2022','Reglas de acceso remoto, dispositivos y aceptación de usuarios.'),
('7.1','Perímetros de seguridad física','Delimitar las áreas que protegen equipos e información.','Prevenir acceso físico no autorizado.','FISICO','ISO/IEC 27002:2022','Áreas delimitadas y mecanismos de acceso observables.'),
('7.4','Monitoreo de seguridad física','Supervisar áreas sensibles y registrar eventos relevantes.','Detectar acceso o actividad física indebida.','FISICO','ISO/IEC 27002:2022','Registros de monitoreo y revisión de alertas disponibles.'),
('8.1','Dispositivos de usuario final','Aplicar medidas de seguridad a equipos de usuario.','Proteger los puntos de acceso a información.','TECNOLOGICO','ISO/IEC 27002:2022','Configuraciones, inventario y protección de dispositivos verificables.'),
('8.13','Respaldo de información','Realizar y comprobar copias de respaldo.','Facilitar recuperación de información.','TECNOLOGICO','ISO/IEC 27002:2022','Calendario, ejecución y pruebas de restauración documentadas.'),
('8.15','Registro de eventos','Mantener registros pertinentes de sistemas y accesos.','Facilitar detección e investigación.','TECNOLOGICO','ISO/IEC 27002:2022','Logs protegidos, retención y revisión evidenciables.'),
('8.23','Filtrado web','Gestionar el acceso a sitios web según el riesgo.','Reducir exposición a contenido web malicioso.','TECNOLOGICO','ISO/IEC 27002:2022','Política de filtrado, configuración activa y revisión de bloqueos.');

create function public.seed_demo() returns uuid language plpgsql security definer
set search_path = public as $$
declare org uuid; a uuid; c record; e uuid; f uuid; ev1 uuid; ev2 uuid; ev3 uuid;
begin
 if not public.can_write() then raise exception 'No autorizado'; end if;
 insert into public.organizations(name,description,sector)
 values('Empresa ABC','Organización ficticia para demostración académica. Presta servicios tecnológicos; dispone de servidores, estaciones, aplicaciones, bases de datos de clientes y red corporativa.','Servicios tecnológicos') returning id into org;
 insert into public.audits(organization_id,name,description,objective,scope,start_date,end_date,responsible_id,audit_type,status)
 values(org,'Auditoría de seguridad de Empresa ABC','Escenario completamente simulado para aprendizaje.','Evaluar de forma académica la implementación de controles seleccionados.','Servidores, estaciones de trabajo, aplicaciones empresariales, bases de datos de clientes, red corporativa y usuarios.',current_date-interval '14 days',current_date+interval '14 days',auth.uid(),'Interna','PLANIFICADA') returning id into a;
 update public.audits set status='EN_EJECUCION' where id=a;
 if (select count(*) from public.controls where active and code in ('5.1','5.9','5.15','5.24','6.3','6.7','7.1','7.4','8.1','8.13','8.15','8.23')) <> 12
 then raise exception 'El catálogo inicial debe mantener activos sus 12 controles para crear la demostración'; end if;
 for c in select id,code from public.controls where active and code in ('5.1','5.9','5.15','5.24','6.3','6.7','7.1','7.4','8.1','8.13','8.15','8.23') order by code loop
   insert into public.audit_controls(audit_id,control_id) values(a,c.id);
   insert into public.evaluations(audit_id,control_id,status,observations,justification,evaluator_id,evaluated_at)
   values(a,c.id,
     case c.code when '5.15' then 'PARCIALMENTE_IMPLEMENTADO'::public.evaluation_status
       when '8.13' then 'NO_IMPLEMENTADO'::public.evaluation_status
       when '8.23' then 'PARCIALMENTE_IMPLEMENTADO'::public.evaluation_status
       when '7.4' then 'NO_APLICABLE'::public.evaluation_status
       else 'IMPLEMENTADO'::public.evaluation_status end,
     case c.code when '5.15' then 'Simulación: las revisiones de acceso no cubren todas las cuentas de servicio.'
       when '8.13' then 'Simulación: no se documentó una prueba de restauración.'
       when '8.23' then 'Simulación: el filtrado no cubre equipos remotos.'
       when '7.4' then 'Simulación: el alcance académico excluye las instalaciones físicas de terceros.'
       else 'Simulación: criterio revisado con documentación ficticia.' end,
     case when c.code='7.4' then 'Las áreas físicas del proveedor externo están fuera del alcance definido.' else 'Valoración académica basada en el escenario simulado.' end,
     auth.uid(),current_date);
 end loop;
 insert into public.evidences(audit_id,control_id,name,description,evidence_type,source,obtained_at,external_reference,is_simulated,registered_by)
 select a,id,'Matriz de accesos (simulada)','Listado ficticio de usuarios y cuentas de servicio.','DOCUMENTO','Empresa ABC',current_date,'demo://matriz-accesos',true,auth.uid()
 from public.controls where code='5.15' and active returning id into ev1;
 insert into public.evidences(audit_id,control_id,name,description,evidence_type,source,obtained_at,external_reference,is_simulated,registered_by)
 select a,id,'Registro de restauración (simulado)','No contiene una prueba de restauración completada.','REGISTRO','Empresa ABC',current_date,'demo://restauracion',true,auth.uid()
 from public.controls where code='8.13' and active returning id into ev2;
 insert into public.evidences(audit_id,control_id,name,description,evidence_type,source,obtained_at,external_reference,is_simulated,registered_by)
 select a,id,'Configuración de filtrado (simulada)','Captura ficticia de la política de filtrado web.','CAPTURA','Empresa ABC',current_date,'demo://filtrado-web',true,auth.uid()
 from public.controls where code='8.23' and active returning id into ev3;
 insert into public.findings(audit_id,control_id,code,title,condition,criteria,cause,effect,severity,responsible_id)
 select a,id,'ABC-001','Revisión incompleta de accesos','Las cuentas de servicio no figuran en la revisión periódica simulada.','El control 5.15 requiere reglas y revisión de accesos según el criterio interno seleccionado.','La matriz de revisión excluye cuentas técnicas.','Podrían conservarse permisos innecesarios.','ALTA',auth.uid()
 from public.controls where code='5.15' and active returning id into f;
 insert into public.finding_evidences(finding_id,evidence_id) values(f,ev1);
 insert into public.recommendations(finding_id,title,description,suggested_action,proposed_responsible,target_date,priority)
 values(f,'Ampliar revisión de accesos','Incluir cuentas de servicio en la revisión.','Actualizar el inventario y verificar permisos de cuentas técnicas.','Administrador de identidades',current_date+interval '30 days','ALTA');
 insert into public.findings(audit_id,control_id,code,title,condition,criteria,cause,effect,severity,responsible_id)
 select a,id,'ABC-002','Restauración sin prueba documentada','No existe prueba de restauración en el material simulado.','El criterio interno del control 8.13 exige comprobar la recuperación.','No se definió un calendario de pruebas.','La capacidad de recuperación permanece incierta.','ALTA',auth.uid()
 from public.controls where code='8.13' and active returning id into f;
 insert into public.finding_evidences(finding_id,evidence_id) values(f,ev2);
 insert into public.recommendations(finding_id,title,description,suggested_action,proposed_responsible,target_date,priority)
 values(f,'Probar restauraciones','Documentar una prueba de recuperación.','Planificar y ejecutar una restauración controlada con registro de resultados.','Equipo de infraestructura',current_date+interval '21 days','ALTA');
 insert into public.findings(audit_id,control_id,code,title,condition,criteria,cause,effect,severity,responsible_id)
 select a,id,'ABC-003','Cobertura parcial de filtrado web','Los equipos remotos quedan fuera de la configuración simulada.','El criterio interno del control 8.23 contempla el acceso web de equipos en alcance.','La política se aplica únicamente a la red interna.','Usuarios remotos podrían acceder a sitios riesgosos.','MEDIA',auth.uid()
 from public.controls where code='8.23' and active returning id into f;
 insert into public.finding_evidences(finding_id,evidence_id) values(f,ev3);
 insert into public.recommendations(finding_id,title,description,suggested_action,proposed_responsible,target_date,priority)
 values(f,'Extender filtrado web','Cubrir equipos fuera de la red corporativa.','Aplicar filtrado al acceso remoto y revisar los registros de bloqueo.','Equipo de seguridad',current_date+interval '45 days','MEDIA');
 return a;
end $$;
revoke all on function public.seed_demo() from public;
grant execute on function public.seed_demo() to authenticated;
