
# Project Patterns & Rules

This document outlines the architectural patterns and coding rules for the OmniMIN project.

## Frontend Patterns

### 1. Notifications (Toast)
**Rule:** Do NOT use `sonner` or other external toast libraries directly in feature components.
**Pattern:** Use the internal `showToast` utility which wraps the custom `useNotificationStore`.

```typescript
// ✅ CORRECT
import { showToast } from '@/utils/ui';

showToast('Operation successful', 'success');
showToast('Something went wrong', 'error');

// ❌ INCORRECT
import { toast } from 'sonner';
toast.success('...');
```

### 2. State Management
**Library:** Zustand
**Store:** `src/stores/useAppStore.ts`
**Pattern:** 
- All global UI state (modals, active server/db) resides in `useAppStore`.
- Use specific selectors when possible to avoid unnecessary re-renders (though Zustand handles this well).

### 3. Data Fetching
**Library:** TanStack Query (React Query)
**Pattern:**
- Wrap Tauri `invoke` calls in `useQuery` or `useMutation`.
- Use `queryKeys` structured as `['entity', 'id', 'sub-entity']`.
- Invalidate queries on mutation success.

```typescript
const { data } = useQuery({
    queryKey: ['tables', currentDb],
    queryFn: () => invoke('get_tables', { db: currentDb })
});
```

### 4. Icons
**Library:** `lucide-react`
**Pattern:** Use named imports.
```tsx
import { Save, Trash2 } from 'lucide-react';
```

## Backend Patterns (Tauri/Rust)

### 1. Command Registration
**File:** `src-tauri/src/lib.rs` (and `main.rs`)
**Pattern:** All commands must be registered in the `invoke_handler` builder chain.

### 2. Module Structure
**Directory:** `src-tauri/src/commands/`
**Pattern:** Group commands by domain (e.g., `database.rs`, `table.rs`, `users.rs`).

### 3. Error Handling
- Commands return `Result<T, String>`.
- Errors are stringified messages that the frontend displays via `showToast`.

## Directory Structure
- `src/components/ui`: Generic, reusable UI components (shadcn-like).
- `src/features`: Domain-specific components ("Screens" or "Widgets").
- `src/stores`: Global state definitions.
- `src/utils`: Helper functions.
- `src-tauri/src/commands`: Backend logic.
