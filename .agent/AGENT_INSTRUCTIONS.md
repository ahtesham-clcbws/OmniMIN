# Agent Instructions & Handoff Guide

## Project Context
This is **OmniMIN**, a Native MySQL/Mongo Manager built with **Tauri 2.0** and **Rust**. It is designed to be a lightweight replacement for PhpMyAdmin.

## Documentation Structure (.agent/)
The `.agent` directory is the single source of truth for this project.

### 1. Rules (`.agent/rules/`)
### 1. Rules (`rules/`)
**Strict guidelines that must be followed.**
- [`agent_persistence.md`](rules/agent_persistence.md): **CRITICAL**. How to save your work context.
- [`best_practices.md`](rules/best_practices.md): UI/UX and Code Quality standards.
- [`frontend_rules.md`](rules/frontend_rules.md) & [`backend_rules.md`](rules/backend_rules.md): Specific tech stack rules.
- [`strict_typing.md`](rules/strict_typing.md): TypeScript requirements.
- [`component_structure.md`](rules/component_structure.md): React component patterns.
- [`git_conventions.md`](rules/git_conventions.md): Commit and branching rules.

### 2. Workflows (`workflows/`)
**Step-by-step guides for common tasks.**
- [`setup_environment.md`](workflows/setup_environment.md): Installation and setup.
- [`production_build.md`](workflows/production_build.md): Building for release (Manual & Automated).
- [`new_feature.md`](workflows/new_feature.md): Standard process for UI features.
- [`new_backend_command.md`](workflows/new_backend_command.md): Adding Rust/Tauri commands.
- [`debugging.md`](workflows/debugging.md): Troubleshooting.

### 3. Knowledge Base (`./` & `ProjectInfo/`)
- [`PATTERNS.md`](PATTERNS.md): Architectural patterns.
- [`BACKEND_API.md`](BACKEND_API.md): Registry of backend commands.
- [`UI_COMPONENTS.md`](UI_COMPONENTS.md): Registry of UI components.
- [`ProjectInfo/`](ProjectInfo/): Historical context, plans, and task logs.

## Development Workflow
1.  **Start**: Read `task.md` in `.agent/ProjectInfo/`.
2.  **Plan**: Check `implementation_plan.md` (if active) or create one.
3.  **Code**: Follow `rules/` and `workflows/`.
4.  **Finish**: Update `CHLOG_FIXES.md`, `task.md`, and save a session log to `agent_logs/`.
