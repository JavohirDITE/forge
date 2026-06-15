<div align="center">

# 🔨 Forge

**Content infrastructure, your way.**

A headless CMS for developers: model content with typed fields, edit it in a
clean admin panel, and deliver it anywhere through a key-protected API.

**🔗 [Live demo](https://forge-black-three.vercel.app)** — sign in with `demo@forge.app` / `password123`

[Stack](#stack) · [Features](#features) · [Delivery API](#delivery-api) · [Getting started](#getting-started)

</div>

---

## Stack

| Layer        | Tech                                                       |
| ------------ | ---------------------------------------------------------- |
| Framework    | **Next.js 16** (App Router, React 19)                      |
| Language     | **TypeScript** (strict, end-to-end)                        |
| Admin API    | **tRPC v11** + **Zod**                                     |
| Delivery API | **Next.js Route Handlers** (REST, API-key auth, CORS)      |
| Data         | **Prisma 6** + **PostgreSQL**                              |
| Editor       | **TipTap** (rich text)                                     |
| Styling      | **Tailwind CSS v4** + **Framer Motion**                    |
| Auth         | **jose** (JWT) + **bcrypt**, httpOnly cookie sessions      |
| Tooling      | **Docker**, **GitHub Actions** CI                          |

## Features

- **Content modeling** — create content types and add typed fields: text, rich
  text, number, boolean, date, select (with options) and media. Field & type
  API ids are derived automatically (`Blog Post` → `blogPost`).
- **Dynamic entry editor** — the editing form is generated from the schema, with
  a real WYSIWYG editor (TipTap) for rich-text fields and live image previews.
- **Draft → publish workflow** — drafts can be incomplete; required-field
  validation runs on publish, so the public API only serves complete content.
- **Role-based access control** — `OWNER` / `EDITOR` / `VIEWER` per space,
  enforced server-side via `assertSpaceAccess` on every mutation.
- **Scoped API keys** — generate and revoke keys per space; the delivery API is
  gated by them, and `lastUsed` is tracked.
- **Media library** — register assets and reference them from media fields.

## Delivery API

Published content is served from a public, key-authenticated endpoint:

```bash
curl https://your-host/api/cdn/{spaceSlug}/{contentTypeApiId} \
  -H "x-api-key: forge_xxx"
```

```jsonc
{
  "meta": { "space": "demo-blog", "contentType": "blogPost", "count": 2 },
  "data": [
    {
      "id": "clx…",
      "title": "Shipping a headless CMS with tRPC",
      "body": "<h2>Why headless?</h2>…",
      "category": "Engineering",
      "_publishedAt": "2025-…"
    }
  ]
}
```

The handler validates the API key against the space, returns only `PUBLISHED`
entries, sets CORS headers, and updates the key's `lastUsed` timestamp.

## Architecture

```
src/
├─ app/
│  ├─ page.tsx                       # landing
│  ├─ login / register               # auth
│  ├─ spaces/                        # guarded admin (session check in layout)
│  │  ├─ page.tsx                    # spaces dashboard
│  │  └─ [slug]/                     # space shell (sidebar)
│  │     ├─ content/[typeId]/        # entries list + schema builder
│  │     │  └─ [entryId]/            # dynamic entry editor
│  │     ├─ media/                   # media library
│  │     └─ settings/                # API keys
│  └─ api/
│     ├─ trpc/[trpc]/                # admin API
│     └─ cdn/[space]/[type]/         # public delivery API
├─ server/
│  ├─ trpc.ts · access.ts · db.ts
│  └─ routers/                       # auth · space · contentType · entry · asset
├─ components/                       # ui · content · app shells
└─ lib/                              # auth · trpc client · utils · constants
prisma/schema.prisma                 # User · Space · ContentType · Field · Entry · Asset · ApiKey
```

## Getting started

> Requires Node 22+ and Docker.

```bash
npm install
docker compose up -d          # Postgres on :5433
cp .env.example .env          # set AUTH_SECRET
npm run db:push
npm run db:seed
npm run dev
```

Sign in with the seeded account:

```
email:    demo@forge.app
password: password123
```

Then try the delivery API (grab the key from **API & keys** in the space):

```bash
curl http://localhost:3000/api/cdn/demo-blog/blogPost -H "x-api-key: forge_…"
```

### Scripts

| Script             | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Dev server                           |
| `npm run build`    | `prisma generate` + production build |
| `npm run db:push`  | Sync schema to the database          |
| `npm run db:seed`  | Seed a demo space + content          |
| `npm run lint`     | ESLint                               |

---

<div align="center">
A portfolio project. Built with Next.js, tRPC, Prisma & TipTap.
</div>
