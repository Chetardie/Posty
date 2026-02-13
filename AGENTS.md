# Posty — Architecture & Conventions

Guidance for AI agents and developers working on this codebase.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **shadcn/ui** (radix-nova)
- **Tailwind CSS**
- **Supabase** (auth, planned)

## Principles

Follow modern React and Next.js patterns. Prefer Server Actions over client-side API calls or custom API routes.

## Server Actions

- Use Server Actions (`"use server"`) for mutations, form submissions, and data writes.
- Place actions in `lib/actions/` (e.g. `lib/actions/auth.ts`).
- Re-validate with Zod on the server for defense in depth.
- Return typed results: `{ success: true }` or `{ success: false; error: string }`.

## Forms (Hybrid Approach)

- **Client**: React Hook Form + Zod + `@hookform/resolvers` for validation and UX.
- **Submit**: On valid submit, call a Server Action with the validated data.
- Do not use `onSubmit` callbacks that bypass Server Actions; the action is the handler.

## File Structure

```
lib/
  actions/       Server Actions
  validations/    Zod schemas (shared client/server)
components/
  auth/           Auth forms and related components
  ui/             shadcn primitives
app/              Next.js App Router pages
```

## Validation

- Define schemas in `lib/validations/`.
- Export inferred types: `type X = z.infer<typeof xSchema>`.
- Reuse schemas in both client forms and Server Actions.
