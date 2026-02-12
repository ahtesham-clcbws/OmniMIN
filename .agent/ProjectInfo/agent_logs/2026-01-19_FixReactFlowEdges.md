# Session Log: Fix React Flow Edge Errors
**Date:** 2026-01-19
**Goal:** Fix `[React Flow]: Couldn't create edge for source handle id...` errors.

## Actions Taken
1.  Analyzed errors indicating React Flow edges were being created before corresponding Node Handles (Columns) existed.
2.  Verified `TableNode.tsx` renders handles only when `data.columns` is present.
3.  Updated `Designer.tsx` to make the edge creation effect depend on `loadedSchemas`.
4.  Filtered `relations` to only create edges where both Source and Target tables have loaded schemas/columns.

## Result
- Edges now appear gracefully as columns load.
- Console spam and recursion (captured by DebugOverlay) should be eliminated.
