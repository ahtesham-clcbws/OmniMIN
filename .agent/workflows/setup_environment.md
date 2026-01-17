---
description: Workflow for setting up the development environment (Windows/Tauri)
---

# Setup Environment Workflow

This workflow guides you through setting up the necessary tools to develop OmniMIN on Windows.

## 1. Prerequisites (Windows)

### Microsoft Visual Studio C++ Build Tools
You need the C++ linker and libraries.
1. Download the [Visual Studio Build Tools installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
2. Run the installer.
3. Select the **"Desktop development with C++"** workload.
4. Click **Install**.
   *(This may take a while as it downloads ~2GB - 6GB of data).*

### Rust (Programming Language)
1. Download **rustup-init.exe** from [rustup.rs](https://rustup.rs/).
2. Run the executable.
3. It will ask 1/2/3. Press **1** (Proceed with installation via default) and hit Enter.
4. Once finished, you **MUST RESTART YOUR TERMINAL** (or VS Code) for the changes to take effect.

### Node.js
1. Install Node.js (v18+) from [nodejs.org](https://nodejs.org/).

### WebView2
Windows 10 and 11 usually have this installed by default. If you get an error about WebView2 missing later, you can download the "Evergreen Bootstrapper" from Microsoft.

## 2. Verification
After installing and restarting your terminal, run these commands to verify:

```powershell
cargo --version
# Should output something like: cargo 1.xx.x (xxxx-xx-xx)

node -v
# Should output v18+

npm -v
```

## 3. Project Setup
1. Clone the repository.
2. Install frontend dependencies:
    ```bash
    cd www
    npm install
    ```
    *(Note: `npm install` in the root might also be required depending on project structure, but `www` contains the frontend).*

3. Run the development server:
    ```bash
    # Root directory
    npm run tauri dev
    ```
    This will compile the Rust backend and launch the application window.
