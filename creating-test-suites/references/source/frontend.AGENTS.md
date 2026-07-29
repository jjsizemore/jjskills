# Frontend (React) — AI Agent Context

This file provides package-specific rules for the `@syncvia/frontend` web application.

**See also:** Root [AGENTS.md](../AGENTS.md) for project-wide context.

---

## Documentation Freshness

- Treat this file and the frontend-relevant files under `../.github/` as living guidance.
- Whenever frontend scope, UX ownership, workflows, or your current change make this guidance stale, update the relevant section(s) in the same work.
- Treat `src/pages/PrivacyPolicyPage.tsx`, `src/pages/TermsOfServicePage.tsx`, and consent copy in auth/onboarding flows as liability-mitigating docs; if frontend behavior changes what users are told about data use, AI processing, exports, billing, or account terms, update them in the same work.
- Keep package-specific instructions aligned with root `AGENTS.md` plus the applicable `.github/instructions/`, `.github/agents/`, `.github/prompts/`, and related frontend-focused guidance.
- Do not leave stale frontend paths, patterns, ownership notes, status claims, or public-policy copy behind when you have enough context to fix them.

---

## Overview

The web frontend is the **secondary UX surface** for SyncVia.ai (desktop app is primary). It is scoped to:

- **Post-meeting review** — summaries, action items, meeting history for users who may not yet have the desktop app
- **Desktop download / onboarding** — landing page and setup flow
- **Marketing & promotional content** — product pages, feature highlights
- **Beta signup and waitlist conversion**

In-meeting features (real-time questions, live feedback, live transcription display) belong in the **desktop renderer**, not here. Most existing frontend routes for live/in-meeting UX are deprecation candidates once the desktop achieves parity.

**Stack**: React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui, tRPC React Query.

---

## tRPC + TanStack Query (CRITICAL)

The frontend uses `createTRPCOptionsProxy<AppRouter>` which provides `.queryOptions()` and `.mutationOptions()` — NOT `.useQuery()` or `.useMutation()` directly.

### Query Pattern

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

export function Component({ id }: Readonly<{ id: number }>) {
  const queryOptions = React.useMemo(() => trpc.content.getData.queryOptions({ id }), [id]);
  const { data, isLoading, error } = useQuery(queryOptions);

  if (isLoading) return <Spinner />;
  if (error) return <Error error={error} />;
  return <Display data={data} />;
}
```

### Mutation Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

export function Component({ id }: Readonly<{ id: number }>) {
  const queryClient = useQueryClient();
  const queryOptions = React.useMemo(() => trpc.content.getData.queryOptions({ id }), [id]);

  const { mutateAsync, isPending } = useMutation({
    ...trpc.content.update.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
    },
  });

  return <Button onClick={() => mutateAsync({ id, data: 'new' })} disabled={isPending} />;
}
```

### What NOT to Do

- ❌ `trpc.content.getData.useQuery()` — does not exist
- ❌ `trpc.useUtils()` — does not exist
- ❌ `trpc.content.getData.getQueryKey()` — does not exist
- ❌ Manually construct query keys
- ❌ Wrap `queryClient.fetchQuery()` in `useMutation()`
- ❌ Pass options to `mutationOptions()` — use spread operator

---

## Component Rules

- **Props**: Use `Readonly<{ ... }>` for component props.
- **Memoization**: Use `React.useMemo` for query options, `React.useCallback` for handlers.
- **Types**: Import from `@/types/schema.ts` (mapped from backend schema) — never duplicate.
- **Error/Loading**: Always handle loading, error, and empty states.
- **Accessibility**: Use semantic HTML and ARIA attributes.
- **DRY**: Extract custom hooks for shared logic; compose components, don't duplicate.
- **Performance**: Optimize re-renders with `React.memo`, `useMemo`, `useCallback`.

---

## Navigation

- ✅ Use `<Link>` for user-initiated navigation (clickable elements).
- ✅ Use `useNavigate()` for programmatic navigation (after mutations, auth redirects).
- ❌ Never use `window.location.href` for in-app navigation.
- ❌ Never use `<a>` tags for in-app routes.

---

## Logging & Errors

- ❌ Never use `console.*`.
- ✅ Use the structured logger from `src/services/logger.ts`.
- ✅ Handle async failures explicitly.

---

## Key Paths

| Path              | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `src/lib/trpc.ts` | tRPC client setup (singleton proxy)          |
| `src/components/` | Reusable UI components                       |
| `src/pages/`      | Route-level views                            |
| `src/hooks/`      | Custom hooks (useOAuth, useRealTime, etc.)   |
| `src/services/`   | Frontend services (JWT, logger, API clients) |
| `src/contexts/`   | React contexts (WebSocket, auth, theme)      |
| `src/types/`      | Shared types (mapped from backend schema)    |
| `src/routes/`     | Route definitions                            |
