# Siam drafts

A simple **Password → Unlock** board for @masumparvej_. No email, account creation or reviewer enrollment.

The public site contains only a shell. The password is verified on the server using a salted slow verifier; drafts and feedback are fetched only with an expiring opaque session. The password, verifier and privileged database credentials are never included in this repository or frontend. Use **Lock** to revoke the current session and return to the password screen.

Shared access uses a common board identity, not individual reviewer attribution. Sessions last at most12 hours. HTTPS protects transport; no end-to-end encryption claim is made. Keep the chosen password private.

Latest board: https://tanzim-grid.github.io/siam-drafts-app/
Dated batch: append `?date=YYYY-MM-DD`.

Daily publication changes the private Supabase batch only; no public code deployment is needed. Private JSON/HTML artifacts must never be added to this repo. The existing board design, actions, undo/redo and feedback semantics are preserved. Opening X intent is not proof of posting.

`node tests/shell.test.cjs` checks the shell and mocked password/session storage transport. Backend source/runbook is in the private Siam source repository.
