# Directiva: Actualización de Identidad de Marca (Clínica Dental)

## Objetivo
Actualizar de forma consistente la identidad comercial y de marca en toda la plataforma: cambiar «Clínica Dental Lumen» / «Lumen Asistente» por «Clínica Dental Riky» / «Riky Asistente».

## Entradas y Fuentes de Verdad
- Esquema de base de datos (`prisma/schema.prisma`)
- Semilla de datos y migraciones (`prisma/seed.ts`)
- Componentes visuales y textos de la interfaz (`src/app/`, `src/components/`)
- Orquestación de IA y prompts (`src/lib/prompt-builder.ts`, `src/lib/agent-runner.ts`, `src/lib/ai-assistant.ts`)
- Conectores e integraciones (`src/lib/integrations/`)

## Pasos de Ejecución
1. **Modelos y Esquema:** Actualizar los valores por defecto en `prisma/schema.prisma`.
2. **Semilla y Base de Datos:**
   - Actualizar los campos en `prisma/seed.ts` sustituyendo Lumen por Riky.
   - Ajustar el bloque `update` de los `upsert` para que al ejecutarse impacte la base de datos viva (PGlite) existente.
   - Ejecutar la semilla para actualizar los registros actuales en la base de datos activa.
3. **Lógica de Asistente e IA:**
   - Modificar las respuestas fijas de fallback, prompts del sistema y asuntos de correos en `src/lib/`.
4. **Vistas e Interfaz:**
   - Modificar los valores iniciales y textos en formularios, dashboard shell, simulador de chat y demo.
5. **Verificación:**
   - Validar que no queden referencias residuales usando búsqueda global (`git grep`).
   - Comprobar que la base de datos refleje el nuevo nombre en la configuración del negocio y del asistente.

## Restricciones y Casos Borde
- No alterar identificadores fijos como `id: "default"` para evitar duplicación de registros de configuración.
- Asegurar que el cambio en la base de datos persista ejecutando `npx tsx prisma/seed.ts`.
