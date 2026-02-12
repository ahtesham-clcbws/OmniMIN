# Implementation Plan - Context-Aware Navigation Toolbar

## Goal Description
The user needs a way to access Table-specific tools (Insert, Operations, Table Search) without cluttering the UI with a second toolbar.
We will refactor `ViewTabs.tsx` to automatically switch between two distinct "Modes" based on the URL:
1.  **Database Mode**: When at `/server/:id/:db` (and no table).
2.  **Table Mode**: When at `/server/:id/:db/table/:table`.

## User Review Required
None. This aligns with the "Cleaner UI" requested in project rules.

## Proposed Changes

### Frontend

#### [MODIFY] [ViewTabs.tsx](file:///d:/PhpMyAdmin-Native/www/src/features/common/ViewTabs.tsx)
- Import additional icons: `Search`, `Plus` (Insert), `Settings` (Operations), `Zap` (Triggers).
- Define `dbTabs` list.
- Define `tableTabs` list.
- Render the appropriate list based on `tableName` presence.
- Ensure correct `navigate` paths for new items (e.g., `/table/:table/insert`, `/table/:table/operations`).

#### [NEW] [TableSearch.tsx, Insert.tsx, etc.]
- *Note*: Actual views for these new tabs will be handled in subsequent tasks or use placeholders/modals (like `Structure.tsx`'s current Insert modal).
- For now, we point them to existing routes or placeholders.
    - `Insert` -> Can open the Insert Modal in Structure or a dedicated page. *Decision: Dedicated page is clearer for navigation.*
    - `Operations` -> Exists (`TableOperations.tsx`).
    - `Search` -> Exists (`Search.tsx`).

## Verification Plan

### Manual Verification
1.  Navigate to Database. Check tabs: Structure, SQL, Routines, etc.
2.  Navigate to Table. Check tabs: Browse, Structure, SQL, Search, Insert, Operations.
3.  Click "Operations" in Table mode -> Should go to Table Operations.
4.  Click "Structure" in Table mode -> Should go to Table Structure.
