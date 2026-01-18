---
trigger: always_on
---

# React Component Structure

## Rule
**All components must follow a consistent structure to ensure readability and maintainability.**

## File Organization
1.  **Imports**: Group by source (React -> 3rd party -> Internal Components -> Utils/Hooks -> Styles).
2.  **Types/Interfaces**: Define Props interface immediately after imports (if not imported).
3.  **Component Definition**: Use `export default function ComponentName() {}`.
4.  **Sub-components**: Keep small, file-local sub-components at the bottom of the file (or extract if growing too large).

## Naming Conventions
- **Files**: PascalCase (e.g., `ServerDashboard.tsx`).
- **Components**: PascalCase (must match filename).
- **Props**: `ComponentNameProps` (e.g., `ServerDashboardProps`).
- **Handlers**: `handleEventName` (e.g., `handleSubmit`, `handleClose`).

## Pattern Example
```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/useAppStore';

interface UserCardProps {
    name: string;
    role: 'admin' | 'user';
}

export default function UserCard({ name, role }: UserCardProps) {
    // 1. Hooks
    const { theme } = useAppStore();
    
    // 2. State
    const [isActive, setIsActive] = useState(false);

    // 3. Effects (optional)

    // 4. Handlers
    const handleClick = () => setIsActive(!isActive);

    // 5. Render
    return (
        <div className="card">
            <h1>{name}</h1>
            <Button onClick={handleClick}>Toggle</Button>
        </div>
    );
}
```
