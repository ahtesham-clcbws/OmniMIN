# Session Log: Fix Designer Render Loop
**Date:** 2026-01-19
**Goal:** Fix `Maximum update depth exceeded` and `useEffect` dependency errors in Designer.

## Actions Taken
1.  Analyzed crash report showing `Designer.tsx` constantly re-rendering.
2.  Discovered `useDesignerData` was creating new `loadedSchemas` array every render.
3.  **Fix 1**: Memoized `loadedSchemas` using `useMemo` in `useDesignerData.ts`.
4.  **Fix 2**: Switched `useEffect` dependencies in `Designer.tsx` to use `JSON.stringify(...)`.
    *   This forces comparison by *value* rather than *reference*, fixing the issue where React Query returned new arrays causing infinite loops.

## Result
- Designer loaded successfully without loop.
- React Flow warnings about missing handles resolved (by previous step).
