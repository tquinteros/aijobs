# HireMatch — AI-Powered Job Board

## El problema que resuelve

Los job boards tradicionales muestran los mismos trabajos para todos los candidatos.
HireMatch analiza el perfil técnico de cada candidato y rankea los empleos por 
compatibilidad real, usando búsqueda vectorial semántica.

## Cómo funciona el matching
```
Candidato sube CV
  → pdfparse extrae el texto del PDF
  → gpt-4o-mini parsea estructura (skills, seniority, experiencia, idiomas)
  → text-embedding-3-small genera vector de 1536 dimensiones

Empresa crea empleo
  → mismo proceso genera embedding del puesto

Candidato entra a /jobs
  → pgvector calcula similitud coseno entre su vector y todos los empleos activos
  → Score 0-100 aparece en cada card, lista rankeada por compatibilidad
  → Resultado cacheado en Redis por 1h
```

## Features

### Candidato
- Registro y onboarding con subida de CV (PDF)
- Parsing automático de CV con gpt-4o-mini (skills, seniority, experiencia, idiomas, educación)
- Dashboard con resumen del perfil generado por IA
- Edición de perfil (recalcula embedding automáticamente)
- Lista de empleos rankeada por compatibilidad con score visual
- Aplicar a empleos con carta de presentación
- Ver estado de sus aplicaciones
- Chat en tiempo real con empresas (Supabase Realtime)

### Empresa
- Registro y onboarding de empresa
- Crear y gestionar empleos (genera embedding al publicar)
- Ver aplicaciones por empleo con datos del candidato
- Generar score de compatibilidad por candidato on-demand
- Cambiar estado de aplicaciones (recibida → revisión → contactado → contratado)
- Chat en tiempo real con candidatos
- Iniciar conversación directamente desde una aplicación

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 App Router + TypeScript |
| Base de datos | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth con RLS |
| Storage | Supabase Storage (CVs en PDF) |
| Realtime | Supabase Realtime |
| AI | OpenAI gpt-4o-mini + text-embedding-3-small |
| Cache | Redis (Upstash) |
| UI | Tailwind CSS + Shadcn/ui |
| Data fetching | TanStack Query v5 |

## Arquitectura y decisiones técnicas

**SSR + TanStack Query con initialData**
Las páginas son Server Components que fetchean datos en el servidor y los pasan 
como `initialData` a TanStack. Resultado: sin skeleton de carga inicial, 
datos disponibles en el primer render, TanStack maneja cache y mutations en cliente.

**Vector search con pgvector**
Los embeddings se generan con `text-embedding-3-small` (1536 dimensiones).
Las skills se repiten 3x en el texto del embedding para darles más peso semántico
vs palabras genéricas del CV. La búsqueda usa similitud coseno via `match_jobs_for_candidate()`.

**Cache estratégico con Redis**
Los resultados de vector search se cachean por usuario (TTL 1h).
El cache se invalida cuando el candidato actualiza su CV o cuando una empresa 
publica un nuevo empleo (`redis.keys("jobs:vector:*")` → delete all).

**Optimistic updates en el chat**
Los mensajes aparecen inmediatamente con `opacity-60` mientras se guardan en DB.
Si falla, el mensaje se elimina y el texto vuelve al input.
Supabase Realtime reemplaza el optimista con el mensaje real de la DB.

**Cursor-based pagination**
El chat carga los últimos 20 mensajes inicialmente.
Al scrollear hacia arriba fetchea páginas anteriores usando `created_at` como cursor,
restaurando la posición del scroll con `useLayoutEffect` para evitar saltos visuales.

**Seguridad**
- RLS en todas las tablas (conversations, messages, applications, matches, job_postings)
- Verificación de ownership en cada Server Action
- supabaseAdmin (service role) solo para operaciones que requieren bypass de RLS justificado
- Rate limiting de actualizaciones de CV (1 vez cada 24hs)

## Estructura del proyecto
```
app/
  (auth)/          → login, registro
  onboarding/      → candidate (perfil + CV) / company
  jobs/            → lista pública con vector search
  dashboard/
    candidate/     → resumen, CV, empleos, aplicaciones, mensajes
    company/       → empleos, aplicaciones por empleo, mensajes
lib/
  actions/         → Server Actions (candidate, company, job, message)
  ai/              → embeddings (generateEmbedding, buildCandidateText, buildJobText)
  supabase/        → client, server, admin
  hooks/           → useUnreadCount
components/
  dashboard/
    candidate/     → ProfileSummary, EditProfileSheet, ConversationChat
    company/       → JobDetails, ApplicationCard, ConversationChatCompany
  ui/              → TagInput, UnreadBadge, ScoreBadge
```

## Roadmap

### MVP pendiente
- [ ] Editar job posting (regenera embedding)
- [ ] Editar company profile
- [ ] Estado de aplicación visible para candidato
- [ ] Notificaciones de mensajes no leídos en el nav
- [ ] Landing page
- [ ] Usuario demo para pruebas sin registro

### Post-MVP
- [ ] AI Match Detail — breakdown del score con gpt-4o-mini
      (strengths, gaps, explanation, recommendation)
- [ ] Email notifications con Resend
- [ ] Filtros en /jobs (remoto, seniority, skills)
- [ ] Analytics para empresa (views, conversion rate por empleo)
- [ ] Búsqueda semántica libre en /jobs

## Variables de entorno
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_APP_URL=
```