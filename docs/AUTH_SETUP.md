# Supabase Auth Setup — Personal Notes App

This guide explains how to enable Supabase Auth in the React frontend. The app now gates content behind Supabase authentication and provides sign-in with magic link or OAuth.

## 1) Prerequisites

- Supabase project created (see docs/SETUP_SUPABASE.md)
- Database schema and RLS are applied
- Frontend environment variables configured:
  - REACT_APP_SUPABASE_URL
  - REACT_APP_SUPABASE_KEY
  - Optional: REACT_APP_FRONTEND_URL (used as the auth redirect URL)

Example .env:
REACT_APP_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
REACT_APP_SUPABASE_KEY=eyJhbGciOi... (anon public key)
REACT_APP_FRONTEND_URL=http://localhost:3000

Note: Do not put the service role key in the frontend.

## 2) Configure Auth Providers (Optional)

In Supabase dashboard:
- Go to Authentication > Providers
- Enable desired OAuth providers (e.g., GitHub, Google)
- Configure callback URL: set to your front-end URL (e.g., http://localhost:3000 or deployed site URL)

For magic link (email OTP), make sure email is enabled (Auth > Email templates). The app uses signInWithOtp with emailRedirectTo set to REACT_APP_FRONTEND_URL.

## 3) Frontend Components

- src/services/authService.js
  - Wraps Supabase auth operations: getSession, onAuthStateChange, signInWithEmail, signInWithOAuth, signOut.
- src/hooks/useAuth.js
  - Provides React state for session/user plus helper methods.
- src/components/AuthGate.jsx
  - Wraps children and requires auth. When unauthenticated, renders a simple sign-in UI supporting:
    - Email magic link sign-in
    - OAuth providers (GitHub, Google)
- src/components/TopBar.jsx
  - Shows user email when signed in, and a Sign out button.
- src/App.js
  - Uses useAuth to supply userId to notes data hooks.
- src/index.js
  - Wraps the application in AuthGate, requiring users to sign in.

## 4) Usage Notes

- Sign-in with email:
  - Enter your email and click “Send Link”.
  - Check your inbox for a Supabase magic link; clicking it will redirect back to REACT_APP_FRONTEND_URL and automatically sign you in.

- OAuth:
  - Click the GitHub or Google button to sign in via the provider.
  - You must have the provider enabled and configured in Supabase.

- After authentication, RLS policies will use auth.uid() to restrict access to your own notes only.

## 5) Troubleshooting

- permission denied for table notes:
  - Ensure you are signed in (Top bar should show your email).
  - Ensure RLS policies in docs/supabase_policies.sql are applied.

- Magic link email not received:
  - Check spam folder.
  - Verify your SMTP/email setup in Supabase project.
  - Confirm REACT_APP_FRONTEND_URL matches your actual running URL.

- OAuth popup blocked or failing:
  - Check provider configuration in Supabase (callback URLs).
  - Ensure your local URL matches the provider's allowed list.

## 6) Security

- Only use the anon public key in the frontend.
- Never expose SUPABASE_SERVICE_ROLE_KEY in client code.
- RLS ensures per-user access control.
- Sign-out clears session on the client.

You’re set! With Auth enabled, users can securely manage their personal notes and all DB operations are scoped to their identity via RLS.
