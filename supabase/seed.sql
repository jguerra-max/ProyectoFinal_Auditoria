-- El catálogo de 12 controles se inserta en la migración 202611130002_catalog_demo.sql.
-- La demostración depende de auth.uid() y se crea desde Configuración con sesión autenticada.
-- Comprobación del seed inicial en el SQL Editor:
select code, name, category, standard_source from public.controls where active order by code;
