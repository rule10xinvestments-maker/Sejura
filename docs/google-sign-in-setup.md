# Google Sign-In Setup

Google Sign-In is only for owner authentication. It is separate from Google
Calendar OAuth and must not request Calendar scopes.

## Supabase Dashboard

1. Open the staging Supabase project.
2. Go to Authentication > Providers > Google.
3. Enable Google.
4. Add the Google OAuth Client ID.
5. Add the Google OAuth Client Secret.
6. Copy the Supabase callback URL shown on the Google provider page. For hosted
   Supabase it is:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

For current staging project URL `https://edmzeqyrrjwurnlgpevh.supabase.co`, use:

```text
https://edmzeqyrrjwurnlgpevh.supabase.co/auth/v1/callback
```

7. In Authentication > URL Configuration, set Site URL to:

```text
https://sejura-staging.vercel.app
```

8. Add Redirect URLs:

```text
https://sejura-staging.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

Use exact URLs for staging. Preview wildcard URLs may be added separately only
for preview deployments.

## Google Cloud Console

1. Configure the OAuth consent screen for Sejura.
2. Create an OAuth client with application type `Web application`.
3. Add Authorized JavaScript origins:

```text
https://sejura-staging.vercel.app
http://localhost:3000
```

4. Add Authorized redirect URI:

```text
https://edmzeqyrrjwurnlgpevh.supabase.co/auth/v1/callback
```

5. Use only Sign-In/profile scopes:

```text
openid
email
profile
```

Do not add Google Calendar scopes here.

## Vercel Environment

Set this only after Supabase and Google Cloud are configured:

```text
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
```

Keep existing Supabase URL and anon/publishable key unchanged. Do not expose the
Supabase service role key or any Google client secret as `NEXT_PUBLIC_`.
