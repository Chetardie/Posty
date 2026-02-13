# Posty — Architecture & Conventions

Guidance for AI agents and developers working on this codebase.

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Prisma** (PostgreSQL via Supabase)
- **Supabase** (Auth, Storage for post images)
- **shadcn/ui**, **Tailwind CSS**

## Data (Prisma)

- **Post**: content, imageUrl?, authorId?, soft delete via deletedAt
- **Comment**: tree-structured (parentId), same fields as Post
- Use `db` from `lib/db.ts`; `authorId` is Supabase auth user id (nullable for guests)

## Principles

Prefer Server Actions over API routes. Re-validate with Zod on the server. Return `{ success: true }` or `{ success: false; error: string }`.

## Forms

- React Hook Form + Zod + `@hookform/resolvers`
- On submit: call Server Action with validated data (or FormData for file uploads)

## File Structure

```
lib/
  actions/       auth.ts, post.ts
  validations/   auth.ts, post.ts
  db.ts          Prisma singleton
  supabase/      client, server, proxy
components/
  auth/          login-form, signup-form
  post/          create-post-form
  ui/            shadcn primitives
app/             page, login, signup
prisma/         schema, migrations
```

## Validation

- Schemas in `lib/validations/`; export `type X = z.infer<typeof xSchema>`
- Reuse in client forms and Server Actions
