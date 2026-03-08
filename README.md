# EventSprint Manager

Aplicacion web de gestion de eventos con autenticacion en Supabase, analitica operativa e integracion de IA para consultas y cambios directos sobre los datos del usuario.

## Funcionalidades principales
- Registro e inicio de sesion con Supabase Auth.
- Panel de usuario con gestion de eventos personales.
- Panel de administracion con vista global y control de operaciones.
- Asistente IA integrado que puede:
  - Consultar eventos del usuario.
  - Crear, actualizar y eliminar eventos.

## APIs externas utilizadas
- **OpenRouter**: orquestacion de IA con herramientas conectadas a datos reales del usuario.

## Arquitectura
- Frontend: React + Vite.
- Datos y auth: Supabase.
- Microservicio IA: Express (`microservices/ai-gateway`) con OpenRouter SDK.
- Endpoints de app:
  - `POST /api/ai/chat`
  - `GET /api/health`

## Stack
- React 18
- Vite 5
- React Router DOM
- Supabase JS
- React Hook Form
- Zustand
- Recharts
- Lucide React
- Bootstrap 5
- OpenRouter SDK
- Express

## Instalacion
1. Instalar dependencias:
   ```bash
   bun install
   ```
2. Configurar entorno:
   ```bash
   cp .env.example .env
   ```
3. Completar `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
4. Ejecutar en local (frontend + microservicio):
   ```bash
   bun run dev
   ```

### Solucion de problemas local
- Si el asistente responde error de conexion, confirma que el microservicio esta vivo en `http://localhost:8787/api/health`.
- Si falta, ejecuta en otra terminal:
  ```bash
  bun run dev:api
  ```
- Verifica que `OPENROUTER_API_KEY` tenga valor en `.env`.

## Base de datos
- Ejecuta [supabase/schema.sql](./supabase/schema.sql) en Supabase SQL Editor.
- El nivel de acceso se controla con `public.profiles.role`.

## Despliegue
### Frontend + API en Vercel
- Configura en Vercel las variables de entorno del `.env`.
- Las rutas `/api/*` se resuelven con funciones serverless y el frontend mantiene fallback SPA.

### Opcion microservicio separado
- Despliega `microservices/ai-gateway/server.ts` en Railway/Render/Fly.
- Define `VITE_API_BASE_URL` con la URL publica del microservicio.

## Licencia
MIT. Ver [LICENSE](./LICENSE).
