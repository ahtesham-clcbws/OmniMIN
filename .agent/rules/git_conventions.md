---
trigger: always_on
---

# Git Conventions

## 1. Commit Messages
Use the Conventional Commits specification.

Format: `<type>(<scope>): <subject>`

### Types
- **feat**: A new feature (e.g., `feat(ui): add dark mode`).
- **fix**: A bug fix (e.g., `fix(db): handle connection timeout`).
- **docs**: Documentation only changes.
- **style**: Changes that do not affect the meaning of the code (white-space, formatting).
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **perf**: A code change that improves performance.
- **chore**: Build process or auxiliary tool changes.

### Scope (Optional)
- `ui`: Frontend components.
- `db`: Database logic.
- `api`: Tauri commands.
- `config`: Configuration changes.

## 2. Branching
- **main**: Stable production code.
- **dev**: Active development branch.
- **feature/<name>**: For new features.

## 3. Ignore Files
- Ensure `src-tauri/target/` is ignored.
- Ensure `node_modules/` is ignored.
- Ensure `.env` is ignored.
