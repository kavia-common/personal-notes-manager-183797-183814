# Architecture Overview — Personal Notes App

This document explains the current architecture of the Personal Notes App, focused on a direct-frontend Supabase approach, and outlines a clear path to adopt a custom backend later. It covers security considerations, trade-offs, environment variables, and how to evolve the system safely.

## 1) Current Architecture: Direct Frontend → Supabase

The app is a single-page React application that talks directly to Supabase (Postgres + Auth + Storage) from the browser using the public anon key. All CRUD operations for notes are executed from the browser via the Supabase JavaScript SDK.

Key files:
- Frontend root: `notes_app_frontend/`
- Supabase client: `notes_app_frontend/src/supabaseClient.js`
- Notes service: `notes_app_frontend/src/services/notesService.js`
- Hook: `notes_app_frontend/src/hooks/useNotes.js`
- Schema and RLS policies: `docs/supabase_schema.sql`, `docs/supabase_policies.sql`
- Setup guide: `docs/SETUP_SUPABASE.md`

Environment variables (frontend):
- Required
  - `REACT_APP_SUPABASE_URL` — Supabase project URL
  - `REACT_APP_SUPABASE_KEY` — Supabase anon public API key
- Optional (present for potential expansions)
  - `REACT_APP_API_BASE`
  - `REACT_APP_BACKEND_URL`
  - `REACT_APP_FRONTEND_URL`
  - `REACT_APP_WS_URL`
  - `REACT_APP_NODE_ENV`
  - `REACT_APP_NEXT_TELEMETRY_DISABLED`
  - `REACT_APP_ENABLE_SOURCE_MAPS`
  - `REACT_APP_PORT`
  - `REACT_APP_TRUST_PROXY`
  - `REACT_APP_LOG_LEVEL`
  - `REACT_APP_HEALTHCHECK_PATH`
  - `REACT_APP_FEATURE_FLAGS`
  - `REACT_APP_EXPERIMENTS_ENABLED`

Notes table (see `docs/supabase_schema.sql`):
- `id` (uuid), `user_id` (uuid, references `auth.users(id)`), `title`, `content`, `tags` (text[]), `is_archived`, `is_deleted`, timestamps with `updated_at` trigger.

RLS policies (see `docs/supabase_policies.sql`):
- Only owners (where `user_id = auth.uid()`) can select, insert, update, delete.

How it works at runtime:
1. The frontend initializes a Supabase client using anon key.
2. On list/get/create/update/delete, it calls Supabase directly.
3. RLS policies in the database enforce user-level access.

Important: For full security, users must be authenticated via Supabase Auth so `auth.uid()` is present in the session. The UI can render in a “demo” state, but RLS policies will deny access without an authenticated session.

## 2) Security Considerations

- Row Level Security (RLS)
  - All access to `public.notes` is guarded by `auth.uid()`.
  - The policies constrain reads and writes to rows where `notes.user_id = auth.uid()`.
  - Insert policy requires `user_id = auth.uid()`, preventing cross-user creation.

- Anon Key Scope
  - The frontend uses the public “anon” key, never the “service role” key.
  - The anon key is designed to be embedded in clients and is limited by RLS.
  - Never place the “service role” key in client code or `.env` for the frontend.

- Authentication
  - RLS relies on Supabase Auth. Without a valid session, queries fail (`permission denied`).
  - Ensure sign-in flows are added for production (email/password, OAuth, etc.).

- Data Validation & Abuse Mitigation
  - Client-side validation is implemented for basic fields.
  - Consider rate-limiting and server-side validation if/when introducing a backend or edge functions.
  - Consider auditing logs and error tracking.

- Least Privilege by Design
  - RLS strictly scopes data access. Even if the client is compromised, cross-user data access is blocked by the database.

- Storage (if later added)
  - Use private buckets and write storage policies mirroring row ownership.
  - Do not expose credentials that can bypass RLS or storage policies.

## 3) Trade-offs of Direct-to-Supabase (Frontend Only)

Pros:
- Simplicity: fewer moving parts, faster development.
- Cost-effective: no extra backend to host/maintain.
- Performance: fewer network hops between client and database.
- Strong data-layer security with RLS.

Cons:
- Limited server-side logic: enforcing complex business rules on the server is harder.
- Secret management: cannot use server-only secrets (e.g., third-party API keys) from the browser.
- Integration complexity: webhooks, scheduled jobs, cross-system transactions may require edge functions or a custom backend.
- Client bloat: more logic necessarily resides in the client code.
- Rate limiting and abuse protection are limited without a server or edge layer.

When to stay with direct-frontend:
- Simple CRUD apps with per-user data.
- Early-stage MVPs.
- You can fully model access control via RLS.

When to add a backend:
- Non-user-triggered automations or scheduled tasks.
- Integrations needing server-side secrets or secure webhooks.
- Complex validation, workflows, or multi-tenant/business rules beyond RLS scope.
- Need for centralized audit, observability, or rate limiting.

## 4) Migration Path: Introducing a Backend Later

Goal: Add a minimal backend API so the frontend uses REST/GraphQL instead of direct database calls. The backend will use Supabase service role (server side only) or Postgres connection with RLS bypass for administrative flows as needed, while still preserving per-user access rules.

High-level steps:
1) Deploy a backend service (e.g., Node/Express, Fastify, NestJS, or a serverless/edge function).
2) Configure the backend with secure environment variables:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY (server-side only, never exposed to the browser)
   - Optional: JWT secret, logging configs, rate-limit configs.
3) Re-implement data access in the backend:
   - Either:
     - Use Supabase Admin/Service Role with explicit, server-enforced checks for `user_id`.
     - Or connect directly to Postgres and use application-level authorization.
   - For each request, authenticate the user (e.g., via Supabase Auth JWT sent by the client).
   - Enforce ownership on the server before querying/updating data.
4) Change the frontend to call the backend:
   - Replace direct Supabase SDK calls in `notesService.js` with REST/GraphQL fetch calls to the backend.
   - Use new frontend environment variables for base URL (e.g., `REACT_APP_API_BASE` or `REACT_APP_BACKEND_URL`).
5) Optional hybrid:
   - Keep some read paths direct to Supabase if safe and beneficial.
   - Use backend for writes/complex operations only.

### Proposed Backend API Shape (REST)

Base URL:
- `${BACKEND_URL}/api/v1`

Resources:
- Notes
  - GET `/notes` — List notes
    - Query params: `includeArchived`, `includeDeleted`
    - Auth: Required; returns only caller’s notes
  - GET `/notes/:id` — Get a single note by id (owned by caller)
  - POST `/notes` — Create a note
    - Body: `{ title, content, tags }`
    - Server sets `user_id = auth.uid()` (derived from JWT), not from client
  - PATCH `/notes/:id` — Update note
    - Body: any subset of `{ title, content, tags, is_archived, is_deleted }`
    - AuthZ: Must be owner
  - DELETE `/notes/:id` — Soft or hard delete based on backend policy
    - Recommended: soft delete to maintain consistency with current frontend expectations

Auth:
- The frontend includes the user’s Supabase JWT in the Authorization header: `Authorization: Bearer <access_token>`
- The backend validates the token (via Supabase Auth or a compatible verifier).
- The backend determines `auth.uid()` from the token and enforces ownership on all operations.

Error responses:
- Use consistent JSON shape, e.g. `{ error: { code, message } }`

### Frontend Changes for Backend Integration

1) Env vars
- Add and use `REACT_APP_BACKEND_URL` or `REACT_APP_API_BASE`.
- Stop requiring `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_KEY` in the browser if all data access is via backend.
- For a hybrid approach, keep them only where needed.

2) notesService.js
- Replace Supabase SDK calls with `fetch` or an HTTP client to the backend endpoints.
- Include `Authorization: Bearer <token>` header (obtain token from Supabase Auth client on the frontend).

3) supabaseClient.js (if hybrid or for auth only)
- Keep Supabase client only to manage authentication (sign-in, session).
- Do not perform direct table reads/writes if moving entirely to backend.

4) Auth flow
- Ensure the frontend retrieves and refreshes JWT tokens from Supabase Auth and attaches to all backend requests.

### Pros/Cons of Adding a Backend

Pros:
- Centralized business logic, validation, and complex flows.
- Secure handling of secrets and third-party integrations.
- Easier to implement rate limiting, auditing, and observability.
- Single point to evolve data contracts and version APIs.

Cons:
- Additional component to deploy, maintain, and secure.
- Increased latency for some queries vs. direct DB access.
- Potential duplication of ownership checks if not reusing RLS logic carefully.

## 5) Recommended Incremental Strategy

- Phase 1 (Current): Keep direct-to-Supabase with RLS and anon key for rapid iteration.
- Phase 2 (Hybrid): Introduce a backend for writes or selected endpoints requiring stronger validation or secret use. Reads may still go direct to Supabase where safe.
- Phase 3 (Full Backend): Route all CRUD operations through the backend; Supabase client in the frontend is only for authentication (and optional real-time subscriptions if desired).

## 6) Practical Checklist

Current setup (frontend-only):
- [x] RLS enabled (policies in `docs/supabase_policies.sql`)
- [x] Only anon key in frontend
- [x] Never commit service role key
- [x] Validate inputs in client
- [x] Ensure users authenticate to read/write
- [x] Environment variables set (see `docs/SETUP_SUPABASE.md`)

When adding a backend:
- [ ] Decide API shape and versioning strategy (REST v1 as above)
- [ ] Implement auth middleware that verifies Supabase JWTs
- [ ] Implement notes routes with server-side ownership checks
- [ ] Use service role key only on the server
- [ ] Add `REACT_APP_BACKEND_URL` to frontend and migrate services
- [ ] Consider rate limiting, audit logs, metrics
- [ ] Update documentation and `.env.example` across repos

## 7) Future Enhancements

- Real-time updates via Supabase Realtime or WebSockets on the backend.
- Background jobs for archival, indexing, or analytics.
- Tag indexing and search optimization (e.g., PostgreSQL GIN indexes).
- End-to-end encryption per note (client-managed keys) if privacy requirements increase.
- Attachments via Supabase Storage with private buckets and RLS-aligned policies.

---

In summary, the current architecture leverages Supabase directly from the frontend with strong RLS for per-user security. This delivers fast iteration and minimal infrastructure. As the product matures, a backend layer can be introduced to support more complex workflows, secret management, and operational controls while keeping the migration path smooth and incremental.
