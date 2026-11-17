# AuditSys Mini

Sistema integral para la gestión, ejecución y trazabilidad de auditorías de seguridad de la información, estructurado bajo las directrices de las normas internacionales **ISO/IEC 27002:2022** (Controles de Seguridad) e **ISO 19011:2018** (Directrices para la auditoría de los sistemas de gestión).

> **Aviso de alcance:** AuditSys Mini es una plataforma de apoyo académico y práctico para la gestión de auditorías. Facilita la recolección estructurada de evidencias, evaluación de controles y formulación de hallazgos y recomendaciones. No otorga certificaciones oficiales de conformidad.

---

## 🚀 Tecnologías Utilizadas

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack en desarrollo, compilación Webpack optimizada).
- **Librería de interfaz:** [React 19](https://react.dev/).
- **Lenguaje:** [TypeScript 5](https://www.typescriptlang.org/) (tipado estricto en todas las capas).
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) y animaciones fluidas con `tw-animate-css`.
- **Componentes primitivos:** [Base UI](https://base-ui.com/) (`@base-ui/react`) para máxima accesibilidad WAI-ARIA.
- **Gráficos e Indicadores:** [Recharts](https://recharts.org/) para visualización interactiva de métricas de cumplimiento y severidad.
- **Iconografía:** [Lucide React](https://lucide.dev/).
- **Notificaciones:** [Sonner](https://sonner.emilkowal.ski/).

### Backend y Base de Datos
- **Arquitectura de API:** Next.js Route Handlers protegidos con validación por esquemas.
- **Validación de Datos:** [Zod](https://zod.dev/) para validación estricta de payloads y parámetros en cliente y servidor.
- **Base de Datos & Auth:** [Supabase](https://supabase.com/) (PostgreSQL 15+).
  - Autenticación segura mediante cookies SSR (`@supabase/ssr`).
  - Row Level Security (RLS) habilitado en el 100% de las tablas relacionales.
  - Procedimientos almacenados PL/pgSQL para versionado atómico e integridad referencial.
- **Almacenamiento de Evidencias:** Supabase Storage (bucket privado `audit-evidence` con generación de URLs firmadas temporales de 60 segundos).
- **Generación de Informes:** [PDF-Lib](https://pdf-lib.js.org/) para renderizado de dictámenes e informes ejecutivos descargables basados en snapshots inmutables de auditoría.

---

## 📋 Módulos del Sistema

1. **Dashboard:** Panel ejecutivo con métricas de cobertura, auditorías activas/finalizadas, porcentaje global de implementación y distribución de hallazgos por nivel de severidad.
2. **Organizaciones:** Registro y administración de empresas auditadas (razón social, sector económico y datos de contacto).
3. **Auditorías:** Planificación de auditorías por objetivos, alcance, fechas (inicio y fin) y asignación de auditores responsables con flujo de estados (`PLANIFICADA` → `EN_EJECUCION` → `EN_REVISION` → `FINALIZADA`).
4. **Controles de Seguridad (ISO/IEC 27002:2022):** Catálogo maestro de controles clasificados en Organizacionales, Personas, Físicos y Tecnológicos con soporte de versionado histórico inmutable.
5. **Evaluaciones:** Calificación de cada control (`IMPLEMENTADO`, `PARCIALMENTE_IMPLEMENTADO`, `NO_IMPLEMENTADO`, `NO_APLICABLE` con justificación obligatoria).
6. **Evidencias:** Repositorio de soporte probatorio con subida segura de archivos (PDF, PNG, JPG, TXT hasta 4 MB) o enlaces a repositorios externos.
7. **Hallazgos:** Documentación técnica de no conformidades con estructura formal de auditoría: Código, Condición observada, Criterio normativo, Causa, Efecto/Riesgo y Severidad (`CRITICA`, `ALTA`, `MEDIA`, `BAJA`).
8. **Recomendaciones:** Planes de acción correctivos vinculados directamente a los hallazgos identificados, con responsable sugerido, fecha objetivo y estado.
9. **Informes:** Generación de dictámenes oficiales de auditoría con congelamiento de datos (*snapshot*) y descarga en formato PDF.
10. **Configuración y Gestión de Roles:** Panel de administración de usuarios y roles del sistema, además de la utilidad para cargar escenarios de demostración completos con un solo clic.

---

## 🔒 Seguridad y Control de Acceso (RBAC & RLS)

El sistema implementa tres niveles de rol con permisos granulares:

| Funcionalidad / Módulo | ADMINISTRADOR | AUDITOR | CONSULTOR |
| :--- | :---: | :---: | :---: |
| Visualizar Dashboard e Informes | ✅ | ✅ | ✅ |
| Crear y editar Auditorías | ✅ | ✅ | ❌ (Solo lectura) |
| Evaluar controles y subir evidencias | ✅ | ✅ | ❌ (Solo lectura) |
| Registrar Hallazgos y Recomendaciones | ✅ | ✅ | ❌ (Solo lectura) |
| Generar Informes PDF | ✅ | ✅ | ✅ (Descarga) |
| Editar/Versionar Catálogo de Controles | ✅ | ❌ | ❌ |
| Gestionar Roles de Usuario | ✅ | ❌ | ❌ |
| Eliminar Auditorías completas | ✅ | Solo asignadas | ❌ |

---

## 🛠️ Instalación y Configuración Local

### Prerrequisitos
- Node.js versión 20.9 o superior (recomendado **Node.js 22.x**).
- Gestor de paquetes `npm`.
- Cuenta en [Supabase](https://supabase.com).

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/jguerra-max/ProyectoFinal_Auditoria.git
   cd ProyectoFinal_Auditoria
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Cree un archivo `.env.local` en la raíz del proyecto tomando como plantilla `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Complete las credenciales obtenidas en su panel de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_publishable_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_secret_service_role_key
   ```
   > ⚠️ **Importante:** La variable `SUPABASE_SERVICE_ROLE_KEY` nunca debe exponerse al navegador ni llevar el prefijo `NEXT_PUBLIC_`.

4. **Aplicar migraciones en Supabase:**
   En el **SQL Editor** de su panel de Supabase, ejecute en orden los siguientes scripts ubicados en la carpeta `supabase/migrations/`:
   1. `202611130001_initial.sql` (Crea tipos ENUM, tablas, políticas RLS y storage privado).
   2. `202611130002_catalog_demo.sql` (Inserta el catálogo de controles ISO 27002 y la función de datos de prueba).
   3. `202611130003_integrity.sql` (Asegura funciones de versión, eliminación en cascada y snapshot).

5. **Configurar Supabase Auth:**
   - En **Authentication > Providers > Email**, habilite Email/Password.
   - En **Authentication > URL Configuration**:
     - `Site URL`: `http://localhost:3000` (o la URL de producción).
     - `Redirect URLs`: agregar `http://localhost:3000/auth/callback` y `http://localhost:3000/reset-password`.

6. **Crear usuario administrador:**
   Regístrese desde la pantalla de login o cree el usuario en Supabase Auth, y luego asígnele rol de administrador ejecutando en el SQL Editor:
   ```sql
   update public.profiles set role = 'ADMINISTRADOR' where email = 'tu_correo@ejemplo.com';
   ```

7. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abra [http://localhost:3000](http://localhost:3000) en su navegador.

---

## 🌐 Despliegue en Vercel

1. Vincule su repositorio de GitHub en [Vercel](https://vercel.com/).
2. En la configuración del proyecto en Vercel:
   - **Framework Preset:** Next.js
   - **Node.js Version:** 22.x (en *Settings > General > Node.js Version*).
   - **Environment Variables:** Añada:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
3. En el panel de Supabase (**Authentication > URL Configuration**), añada la URL de producción proporcionada por Vercel tanto en `Site URL` como en las `Redirect URLs`.
4. Despliegue el proyecto y verifique el flujo completo (login, auditorías, carga de evidencias y generación de informes PDF).

---

## 📊 Catálogo de Controles ISO/IEC 27002:2022 Incluidos

El sistema cuenta con 12 controles preconfigurados y versionables:
- **5.1:** Políticas para la seguridad de la información.
- **5.9:** Inventario de información y otros activos asociados.
- **5.15:** Control de acceso y privilegios.
- **5.24:** Planificación y preparación de la gestión de incidentes.
- **6.3:** Concientización, formación y capacitación en seguridad.
- **6.7:** Trabajo remoto y teletrabajo seguro.
- **7.1:** Perímetros físicos de seguridad.
- **7.4:** Monitoreo y supervisión física.
- **8.1:** Dispositivos de usuario final.
- **8.13:** Copias de seguridad de la información (Backups).
- **8.15:** Registro y monitorización de eventos (Logs).
- **8.23:** Filtrado y control de navegación web.

---

## 📜 Licencia y Uso Académico

Este proyecto fue desarrollado con propósitos académicos y formativos en metodologías de auditoría de sistemas e ingeniería de software segura.
