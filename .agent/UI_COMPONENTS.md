
# UI Components Registry

This document lists the reusable UI components available in `src/components/ui`.
All components are built using Radix UI primitives and styled with Tailwind CSS (shadcn/ui pattern).

## Available Components

| Component | Path | Description |
|-----------|------|-------------|
| **Button** | `src/components/ui/button.tsx` | Standard button with variants (default, destructive, outline, secondary, ghost, link). |
| **Input** | `src/components/ui/input.tsx` | Text input field with Tailwind styling. |
| **Label** | `src/components/ui/label.tsx` | Accessible label component, typically used with Input. |
| **Select** | `src/components/ui/select.tsx` | Dropdown select component (Radix UI based). |
| **Table** | `src/components/ui/table.tsx` | Data table components (Table, Header, Body, Row, Cell). |
| **Tooltip** | `src/components/ui/tooltip.tsx` | Hover tooltip component. |
| **Modal** | `src/components/ui/Modal.tsx` | Dialog/Modal wrapper component. |
| **NotificationContainer** | `src/components/ui/NotificationContainer.tsx` | Toast notification container. |

## Usage Guidelines

### Imports
Always import components from the alias `@/components/ui/...`.

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
```

### Styling
Components accept a `className` prop for overriding or extending styles via `tailwind-merge`.

```tsx
<Button className="bg-blue-500 hover:bg-blue-600">Custom Button</Button>
```
