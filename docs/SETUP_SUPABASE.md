# Supabase Setup Guide — Personal Notes App

This document explains how to provision the database schema, enable secure Row Level Security (RLS), and connect the React frontend.

## 1) Create a Supabase Project

1. Go to https://app.supabase.com and create a new project.
2. Choose a strong database password and region.
3. Wait for project provisioning to finish.

## 2) Apply the Database Schema

In the Supabase dashboard:
- Navigate to SQL Editor.
- Create a new query and paste the contents of: `docs/supabase_schema.sql`
- Run the query.

What this does:
- Creates a `public.notes` table with:
  - `id` (uuid, PK)
  - `user_id` (owner, references `auth.users(id)`)
  - `title`, `content`, `tags` (text[])
  - `is_archived`, `is_deleted` flags
  - `created_at`, `updated_at`.
- Adds indexes for performance.
- Adds an `updated_at` trigger that automatically sets `updated_at = now()` on every update.

## 3) Enable and Configure Row Level Security (RLS)

Still in the SQL Editor:
- Open a new query and paste the contents of: `docs/supabase_policies.sql`
- Run the query.

What this does:
- Enables RLS on `public.notes`.
- Adds per-user policies so that users can:
  - SELECT only their owned rows.
  - INSERT rows when `user_id = auth.uid()`.
  - UPDATE only their owned rows.
  - DELETE only their owned rows (the app uses soft deletes via `is_deleted`, but the policy allows hard delete too).

Important:
- All access is gated by `auth.uid()`, so you must use Supabase Auth (email/password, OAuth, etc.) for user identity.
- In this template app, unauthenticated usage is allowed at the UI level for demo purposes. However, to actually read/write on the database with RLS enabled, the client must be authenticated and the row `user_id` must match `auth.uid()`.

## 4) Configure Environment Variables in the React App

In the frontend container, set the following environment variables (for local development, create a `.env` file at the project root — do NOT commit secrets):

Required:
- `REACT_APP_SUPABASE_URL` = Your Supabase project URL (Dashboard > Project Settings > API).
- `REACT_APP_SUPABASE_KEY` = Your Project anon public API key (NOT the service role key).

Other available env vars listed by the container (optional; keep defaults if unsure):
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

Example `.env` for development:

```
REACT_APP_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
REACT_APP_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI... (anon public key)
```

Note:
- The app logs a warning if the two required Supabase env vars are missing. The UI will still render, but database calls will fail until configured.
- Never embed the service role key in the frontend.

## 5) Auth Considerations

- Policies use `auth.uid()` to enforce ownership. This requires the frontend to authenticate users via Supabase Auth.
- The current codebase supports passing a `userId` to tag records. In production, you should ensure:
  - The user signs in with Supabase Auth.
  - When creating notes, set `user_id = auth.user().id` on the client. The policies enforce that `user_id` must equal `auth.uid()`, preventing cross-user insert.
- Until authentication is wired in, API calls will fail with RLS enabled unless you test via the SQL editor or with a valid authenticated session.

## 6) Testing the Schema Quickly

In SQL Editor, you can simulate with a service role (server-side) or directly insert rows for a user:

```
-- Example: create a user via Auth (email link) or retrieve an existing user's UUID.
-- Then, as service role (or via SQL editor), you can insert a row owned by that user:
insert into public.notes (user_id, title, content, tags)
values ('<some-auth-user-uuid>', 'My first note', 'Hello world', array['personal','ideas']);
```

From the frontend (after adding auth and signing in), CRUD operations will be restricted to the signed-in user's rows.

## 7) Optional: Attachments

If you plan to add file uploads later:
- Create a Storage bucket (commented section in `supabase_schema.sql`) or use the Storage UI (Storage > New bucket).
- Keep it private and create storage policies similar to table policies (allow users to access only their own files).

## 8) Security Checklist

- RLS is enabled and scoped to `auth.uid()`.
- Only the anon public key is used in the browser.
- Never expose the service role key in client-side code.
- Validate inputs on the client and consider rate limiting via edge functions if you later add server-side code.

## 9) Troubleshooting

- Error: `permission denied for table notes`
  - Ensure you have run policies (RLS enabled).
  - Ensure the user is authenticated and `user_id` is set to `auth.uid()` on inserts/updates.
- Error: `Supabase is not configured`
  - Make sure `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_KEY` are set and the app restarted.

You're set! After applying the schema and policies and adding valid environment variables, the app can securely read/write the authenticated user's notes.
