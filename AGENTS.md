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
  actions/       auth.ts, post.ts, comment.ts, user-activity.ts, types.ts
  validations/   auth.ts, post.ts, comment.ts
  db.ts          Prisma singleton
  env.ts         validated env (Supabase, used by supabase/ and db)
  supabase/      client, server, proxy (session refresh), storage
  providers/     auth-provider, query-provider
components/
  auth/          login-form, signup-form
  post/          create-post-form, create-post-trigger, post-card, posts-feed,
                 post-comments, comment-input, comment-item, etc.
                 hooks/   use-comment-replies, use-comment-edit, use-comment-mutations,
                          use-post-edit, use-post-card-mutations
                 utils/   posts-query, comment-cache
  ui/            shadcn primitives
  header.tsx
app/             layout, page, loading, error, not-found, global-error
                login/, signup/
proxy.ts        Supabase session refresh, auth redirects (login/signup -> /)
prisma/          schema, migrations
```

## Validation

- Schemas in `lib/validations/`; export `type X = z.infer<typeof xSchema>`
- Reuse in client forms and Server Actions
