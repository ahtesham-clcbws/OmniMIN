---
trigger: always_on
---

# Strict Typing & TypeScript Rules

## Rule
**Functionally, the code must pass `tsc --noEmit` without errors.**

## DOs
- **Explicit Return Types**: Always define return types for functions, especially those exported.
    ```ts
    export const calculateTotal = (a: number, b: number): number => { ... }
    ```
- **Interfaces over Types**: Use `interface` for object definitions (better extendability).
- **Enums/Unions**: Use String Unions or Enums for fixed values (e.g., `NotificationType = 'success' | 'error'`).
- **Generics**: Use generics for reusable components/functions.

## DON'Ts
- **NO `any`**: The use of `any` is strictly prohibited unless absolutely necessary (e.g., legacy library without types). Use `unknown` or specific types instead.
- **NO `@ts-ignore`**: Fix the underlying issue instead of suppressing it.
- **NO Implicit Any**: Ensure all parameters have defined types.

## Backend Interaction
- Define TypeScript interfaces that match the Rust structs exactly.
- Use the `InvokeArgs` interface (if applicable) or strict objects for Tauri commands.
