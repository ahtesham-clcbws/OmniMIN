# Session Log: Fix DebugOverlay Dropdown Z-Index
**Date:** 2026-01-19
**Goal:** Fix "no options to select" in DebugOverlay (Dropdown hidden behind overlay).

## Actions Taken
1.  Analyzed `DebugOverlay.tsx` (z-index: 9998) and `select.tsx` (z-index: 50).
2.  Confirmed that `SelectContent` portals to body but defaults to `z-50`, placing it behind the `DebugOverlay`.
3.  Added `className="z-[10000]"` to `SelectContent` in `DebugOverlay.tsx`.

## Result
- Dropdown should now appear on top of the overlay.
