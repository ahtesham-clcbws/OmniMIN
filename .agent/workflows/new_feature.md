
---
description: Standard workflow for implementing new frontend features
---

# Feature Implementation Workflow

Use this workflow when implementing new UI features or components to ensure consistency and prevent regression.

## 1. Pattern Check
Before writing code, verify the project's standard patterns in `.agent/PATTERNS.md`.

- [ ] **Notifications**: Check if you are using `showToast` from `@/utils/ui`.
      - **STOP**: Do NOT import `sonner` or `toast` directly.
      - **USE**: `import { showToast } from '@/utils/ui';`
- [ ] **State**: Check if you need global state (`useAppStore`) or local state.
- [ ] **Components**: Check `.agent/UI_COMPONENTS.md` for existing UI components (Buttons, Inputs, etc.).
      - Do NOT create new styled components if a `shadcn/ui` variant exists.

## 2. Implementation
1.  Create/Update the component in `src/features/...`.
2.  Use `useQuery` types for data fetching (refer to `BACKEND_API.md` for command names).
3.  Handle loading and error states using the standardized UI components.
4.  If adding a new route, update `App.tsx` and ensure it's nested correctly under the Layouts.

## 3. Verification
- [ ] run `npm run tauri dev` (if not running).
- [ ] Verify the feature works.
- [ ] **Self-Correction**: Did you accidentally import forbidden libraries?
      - Run `grep -r "sonner" src/features` to ensure no direct usage remains (except in `ui.ts`).
