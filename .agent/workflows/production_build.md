
---
description: Workflow for building the production application (Windows)
---

# Production Build Workflow

Use this workflow to generate the release binaries for OmniMIN.

## 1. Prerequisites
- Ensure all tests pass (if applicable).
- Update the version number in:
    - `package.json`
    - `src-tauri/tauri.conf.json`

## 2. Build Process
Run the Tauri build command. This will compile the Rust backend and the React frontend.

```bash
npm run tauri build
```

## 3. Output Location
After a successful build, the installer and binaries will be located in:

- **Windows**: `src-tauri/target/release/bundle/nsis/` (Looking for `.exe` installer)

## 4. Troubleshooting
- **"Identifier not found"**: Check `tauri.conf.json` for `identifier` field.
- **"Icon mismatch"**: ensure `src-tauri/icons` contains all required formats.
- **WebView2 errors**: Ensure the target machine has WebView2 runtime installed (default on Windows 11).

## 5. Verification
1.  Navigate to the output folder.
2.  Run the `.exe` installer in a sandbox or test environment.
3.  Verify the app launches and connects to the database.
