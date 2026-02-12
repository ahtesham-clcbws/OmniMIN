# Session Log: Fix DebugOverlay Router Context
**Date:** 2026-01-19
**Goal:** Fix `Uncaught Error: useLocation() may be used only in the context of a <Router> component`.

## Actions Taken
1.  Analyzed error trace pointing to `DebugOverlay` in `main.tsx`/`App.tsx`.
2.  Verified `App.tsx` structure.
3.  Found `DebugOverlay` and `PerformanceOverlay` were placed *after* `</BrowserRouter>`.
4.  Moved both components *inside* `<BrowserRouter>`.

## Result
- HMR updated `App.tsx`.
- Runtime error should be resolved.
