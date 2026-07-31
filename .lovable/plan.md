# Save leads to a database + email the full report

Turn the email box on the results page into a real capture and delivery flow: the person's details and their assessment are stored in your backend, and they get their personalised report by email straight away.

## What the user sees

1. On the results page they enter name + email and submit.
2. Their details and full assessment (answers, top matches, scores, projected spend) are saved.
3. Within seconds they receive a branded email containing the full report: top 3 city matches with scores, projected monthly spend, budget ranges, visa notes, why each matched, what to investigate, plus the disclaimer.
4. The form shows a clear success state ("Report sent to you@example.com"), and a friendly error state if sending fails.

## What gets built

**Backend (Lovable Cloud)**
- Enable Lovable Cloud.
- A `leads` table: name, email, top destination, top-3 snapshot, full answers, projected spend, created_at, plus report-sent status.
- Locked-down access: only server-side code can read leads; the public form can only submit through a server endpoint, never read.
- Basic abuse protection: input validation and a light per-email/session submit limit.

**Email**
- An email sender domain has to be connected before any email can go out. This must be a domain you own (e.g. `mail.yourdomain.com`) — there is no free shared sender. I'll open the setup dialog when we start; emails begin sending once DNS verifies.
- A branded report email template matching the app's look (warm neutral background, deep navy text, muted teal accents, Fraunces/Public Sans-style headings).
- One send per submission, with a de-duplication key so retries can't double-send.

**App changes**
- `src/lib/leads.ts` swaps the localStorage mock for a call to the new server endpoint (same function signature, so components barely change).
- `src/components/lead-capture.tsx` gains sending/sent/error states and passes the full result payload, not just name/email.
- Analytics hooks fire on submit, save success, and email sent.

## Technical notes

- Server route under `src/routes/api/public/` handles submission: Zod-validates input, inserts via the service-role client, then sends the report with the scaffolded `sendTemplateEmail` helper (idempotency key = lead id + template).
- Report email is a React Email template in `src/lib/email-templates/`, rendered from the stored snapshot so the email always matches what was on screen.
- Suppressed recipients (previous bounce/unsubscribe) are recorded on the lead and shown as a soft notice rather than an error.
- Migration includes explicit GRANTs and RLS with no anon read access.

## Prerequisites from you

- A domain you own for sending email. If you don't have one yet, we can still build and store leads now, and switch email on once the domain is verified.
