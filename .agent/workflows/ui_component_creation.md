---
description: Guide for creating new shadcn-like components
---

# UI Component Creation Workflow

## 1. Requirement Analysis
- Does this component already exist in `src/components/ui`? (Check `.agent/UI_COMPONENTS.md`)
- Is it a "Feature" component (`src/features`) or a reusable "UI" primitive (`src/components/ui`)?

## 2. Component Design
- **Theme Support**: Ensure it supports CSS variables for both Light and Dark modes.
- **Props**: Define a strict interface. Extend `HTMLAttributes<HTMLDivElement>` if it wraps a div.

## 3. Implementation Steps
1.  **Create File**: New file in `src/components/ui/[name].tsx`.
2.  **Base Structure**: Copy the "Component Structure" pattern from `rules/component_structure.md`.
3.  **Styling**: Use Tailwind utility classes via `cn()` (from `@/lib/utils`) to allow class merging.
    ```tsx
    import { cn } from "@/lib/utils"
    
    export function Badge({ className, variant, ...props }: BadgeProps) {
      return (
        <div className={cn("bg-primary text-primary-foreground", className)} {...props} />
      )
    }
    ```
4.  **Exports**: Export the component and any necessary sub-components.

## 4. Registration
- Add the new component to `.agent/UI_COMPONENTS.md`.

## 5. Usage
- Import using the alias: `import { Badge } from '@/components/ui/badge'`.
