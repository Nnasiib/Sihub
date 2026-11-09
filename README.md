# SiHub Digital Ecosystem (Somali Innovation Hub)
> *"Connecting People, Empowering Ideas, Creating Opportunities."*

Official multi-sector digital ecosystem for **Somali Innovation Hub (SiHub)**.

---

## Platform Overview

SiHub is a React/Vite public site and role-protected portal backed by an Express API, Prisma, and PostgreSQL. Public records are read from published CMS entries and course records; application forms create persistent submissions for administrator review. The repository does not include institutional seed content, so production copy, contact details, visitor locations, partners, programs, and courses must be published through the CMS or imported from an authorized legacy export.

---

## 🚀 Key Modules Built & Explorable

### Public Site
- Home, About, programs, courses, startups, innovation, community, events, opportunities, mentorship, partnerships, news, and contact pages.
- Page copy and dynamic sections can be managed as CMS page entries. Listing records (such as partners, programs, events, and news) are separately stored as typed CMS entries.
- Public forms create persistent program, opportunity, event, startup, partnership, mentorship, community, contact, and visitor submissions. Public status lookup requires a reference code and matching email.
- Event registrations generate a QR ticket. Approved visitor requests generate a verifiable visitor QR pass.

### Administration
- Overview reads account, published-content, submission, course, and audit records from the API.
- User management supports role changes and account activation/suspension subject to server-side authorization.
- Education management covers course and lesson publication, enrollment review, academic catalog records, assignments, grading, exams, attendance, and certificates.
- CMS tools support content CRUD, review/publication transitions, soft deletion, revisions, restore, dynamic sections, and media references.
- Other tabs manage startup, program, community, event, mentor, opportunity, partner, impact, AI FAQ/configuration, media, and visitor submission records through the CMS, submission, media, or education APIs.
- The audit view is read-only. Settings describe current access/security behavior and link organization copy editing to the CMS; they are not a general infrastructure control plane.

### Role Portals
- Student and learner dashboards show applications, approved course content, progress, assignments, exams, attendance, profiles, and issued certificates.
- Instructor workflows are scoped to assigned courses and support coursework, grading, exams, and attendance.
- Startup, mentor, partner, and visitor portals use persisted submissions and published content where supported by their API routes.

### 4. Interactive SiHub AI Assistant
- Dual-language support (**English & Somali / Af-Soomaali**).
- Guidance on courses, incubation, grants, and regional campus locations.
- Direct-action buttons that navigate users to the appropriate section or form.

### Authentication And Roles
- Account registration creates a student account. Elevated roles must be assigned by an authorized administrator.
- The top bar provides language selection, password change, and sign-out controls; there is no persona-switching or demo-data reset feature.
- Direct portal URLs are supported, and authorization is checked both in the client view gate and on protected API routes.

---

## Runtime And Security

- PostgreSQL schema, generated client, and six migrations are in `prisma/`. Prisma is the runtime ORM; `src/types/index.ts` contains UI contracts, not the database source of truth.
- Passwords use Argon2id. Opaque session tokens are hashed in the database and sent in HttpOnly, SameSite=Strict cookies. Mutating API requests require a signed CSRF token.
- Express uses Helmet, rate limits sensitive routes, validates input with Zod, and enforces roles server-side. Administrative decisions create audit records.
- Media storage is optional and uses S3-compatible presigned uploads/downloads. Gemini and password-reset email delivery are also optional server-side integrations.

## Local Development

Use Node.js 22, PostgreSQL, and a local development database only. Copy `.env.example` to `.env`, set local `DATABASE_URL`, `DIRECT_URL`, and a 32-character `SESSION_SECRET`; configure an owner bootstrap password of at least 16 characters if needed. Do not use production credentials for local tests.

```sh
npm ci --legacy-peer-deps
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev:api
```

In a second terminal run `npm run dev` and open `http://localhost:3000`. Useful checks are `npm test`, `npm run lint`, `npm run prisma:validate`, and `npm run build`. Production Docker serves the app and API on port 3000; database migrations are deployed separately with `npm run db:deploy`.

The legacy export page reads browser `sihub_demo_*` keys and downloads a JSON file without changing browser data. `npm run db:import-legacy -- /path/to/export.json` is a dry run; add `--apply` only when intentionally importing into a safe local database.
