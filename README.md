# Siam drafts

Public **login-only app shell** for @masumparvej_'s private review board.

The shell contains no draft batch or feedback. A confirmed Supabase account must be explicitly approved by the owner before authenticated database access is allowed. Creating an account never grants board membership automatically.

1. Open the site and choose **Create account**, or sign in if already registered.
2. Confirm your email, then return to sign in. If a confirmation redirects elsewhere, reopen this site.
3. Tell the owner which confirmed email you used. The owner approves that exact identity; refresh afterward.
4. The stable site loads the newest accessible daily batch. `?date=YYYY-MM-DD` selects an immutable dated batch.

The project must allow this site's signup callback URL in its Supabase Auth redirect settings for automatic email-confirmation return. No global provider/SMTP settings are changed by this repository. No password is shared with the bot or owner.

Private data and historical artifacts stay in the separate private source repository and authenticated Supabase tables. Only a frontend-safe publishable key is included here. Do not upload private JSON/HTML artifacts into this repository or its history.

Daily content publication changes the authenticated database only; it does not require a public code push. Board UI remains frozen while the six daily data constants arrive from the authenticated payload.

`node tests/shell.test.cjs` validates shell syntax and mocked auth/data gating. Actual browser and email confirmation testing still requires the reviewer's own action.
