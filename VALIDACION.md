# Estado de validación

## Comprobado en este proyecto

- `npm run build`: compilación de producción y tipos TypeScript correcta.
- `npm run lint`: sin errores.
- `npm test`: cálculo con controles no aplicables, denominador cero y generación de PDF desde una instantánea.
- Navegador: página de acceso revisada en escritorio y móvil; sin errores de consola después de desactivar la opción de prerenderizado de la plantilla.
- Sin sesión: `/dashboard` redirige y `/api/bootstrap` y `/api/files` responden 401.
- `npm audit --omit=dev`: sin vulnerabilidades reportadas en dependencias de ejecución.

## Requiere un proyecto Supabase y un despliegue Vercel

Estas verificaciones no se pueden afirmar como aprobadas sin credenciales externas:

1. Aplicar las tres migraciones SQL en orden y comprobar que hay 12 controles activos.
2. Crear cuentas `ADMINISTRADOR`, `AUDITOR` y `CONSULTOR`; comprobar inicio, cierre, recuperación y las restricciones de escritura.
3. Crear organización y auditoría; confirmar asociación automática de controles, evaluación única, justificación obligatoria de `NO_APLICABLE` y transiciones de estado.
4. Crear evidencia de referencia y cargar un PDF privado menor de 4 MB; descargar mediante URL temporal; comprobar que un usuario sin sesión recibe 401.
5. Vincular evidencia a hallazgo, crear recomendación, generar informe y comparar PDF/preview con los datos existentes.
6. Editar una evaluación después del informe y confirmar que la versión anterior conserva su instantánea.
7. Crear y eliminar la demostración de Empresa ABC; verificar que todos los registros se relacionan y que los archivos asociados se retiran de Storage.
8. Cerrar sesión y volver a entrar para comprobar persistencia. Repetir en Vercel con las variables de entorno de producción.

La aplicación está preparada para estas pruebas; no se ha conectado a un proyecto Supabase ni desplegado en Vercel durante esta entrega.
