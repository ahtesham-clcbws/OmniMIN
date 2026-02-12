# Session Log: Fix Infinite Render Loop
**Date:** 2026-01-19
**Goal:** Fix `Maximum update depth exceeded` error in `DebugOverlay`/`EdgeWrapper`.

## Actions Taken
1.  Analyzed error trace pointing to `useConsoleCapture.ts` triggering recursive updates.
2.  Refactored `useConsoleCapture.ts` to wrap `setLogs` in `setTimeout(..., 0)`.
3.  This moves the state update out of the render cycle, preventing the "update during render" violation.
4.  Consolidated duplicate logging logic into a helper `addLog` function.

## Result
- HMR updated `useConsoleCapture.ts`.
- Infinite loop should be resolved.
- Debug logging remains functional but asynchronous to the render phase.
