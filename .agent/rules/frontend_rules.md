
# Frontend Coding Rules

## 1. Notifications
**STRICT**: Never use `sonner` or `react-hot-toast` directly in feature components.
- Always use the internal wrapper: `import { showToast } from '@/utils/ui';`
- This ensures centralized control over notification styling and behavior.

## 2. Component Usage
- Use `@/components/ui/*` for all basic elements.
- Do not hardcode Tailwind classes for basic button/input styles; use the components.

## 3. Icons
- Use `lucide-react` for all icons.
- Import named icons: `import { IconName } from 'lucide-react';`

## 4. Backend Interaction
- Always typed `invoke` calls.
- Prefer `react-query` hooks over raw `useEffect` + `invoke`.
