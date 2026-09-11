# SmartyAI Customer Frontend

Separate customer-facing website and account dashboard for SmartyAI, built with Next.js App Router, TypeScript, Tailwind CSS, and Lucide icons.

## Run locally

Requirements: Node.js 20+ and the SmartyAI Express backend.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

The default frontend is `http://localhost:3000`. API requests use the deployed SmartyAI backend at `https://bhavishya.site`.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Public base URL of the Express service, without a trailing slash |
| `NEXT_PUBLIC_SITE_URL` | Canonical public website origin used for metadata, robots, and sitemap |

No AI provider credentials belong in this application. Provider secrets remain in the server environment.

## Deploy to Vercel

Import this repository into Vercel and configure one environment value for Production, Preview, and Development:

```text
NEXT_PUBLIC_API_BASE_URL=https://bhavishya.site
```

Set `NEXT_PUBLIC_SITE_URL` to the final Vercel production origin after the first deployment. Do not add provider keys, JWT secrets, database credentials, or other backend secrets to Vercel frontend variables. Values prefixed with `NEXT_PUBLIC_` are intentionally visible in browser code.

## Backend binding

The frontend uses only current backend operations:

- public plan retrieval;
- email/password registration and login;
- authenticated account, plan, usage, API key, and payment-status reads;
- authenticated demo-context reads;
- manual development plan activation;
- downloadable artifacts served by the Express backend.

The website and desktop build are currently demos and must be used only with non-sensitive test data. The browser resume workspace parses PDFs and saves drafts locally; its AI optimization calls are disabled. Desktop resume extraction and automatic profile/job-description synchronization are also disabled. API key rotation/revocation, browser-side profile editing, password reset, invoices, refunds, and production checkout are not currently exposed.

## Authentication note

The current Express API returns bearer JWTs and does not support cookie sessions. This frontend stores the JWT in browser `localStorage` for compatibility. Before a public production launch, migrate to secure HTTP-only cookies or a server-managed session and add CSRF/session controls in the backend.

## Checks

```bash
npm run lint
npm run build
```
