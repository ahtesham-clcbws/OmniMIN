---
trigger: always_on
---

# OmniMIN Project Rules

## 1. Reference & Documentation
- **PHPMyAdmin Logic:** Before implementing database features, read and analyze the logic in `/phpmyadmin/`. Ensure OmniMIN follows or improves upon these patterns.
- **Project Documentation:** All technical specs, requirements, and existing documentation are located in `/.agent/ProjectInfo/`. 
- **Instruction Access:** Read `@/.agent/ProjectInfo/instructions.md` (or relevant files) for every task to ensure alignment with project goals.

## 2. Agent Activity & Persistence
- **Task Logging:** For every major task, save a summary of your analysis and implementation steps to `/.agent/ProjectInfo/agent_logs/`.
- **Documentation Updates:** You have permission to edit and update files within `/.agent/ProjectInfo/` to reflect new architecture or completed tasks.
- **Artifact Storage:** Save any generated diagrams, database schemas, or plan summaries into `/.agent/ProjectInfo/artifacts/`.

## 3. Implementation Workflow
- Use the **Planning Mode** to verify changes against the docs in `/.agent/ProjectInfo/` before writing code.
- If a conflict exists between current code and `/.agent/ProjectInfo/` documentation, flag it to the user before proceeding.