# Session Log: Fix Port Conflict
**Date:** 2026-01-19
**Goal:** Fix "Port 1420 is already in use" error blocking `npm run tauri dev`.

## Actions Taken
1.  Identified environment: Windows, OmniMIN project.
2.  Checked `.agent` directory for context.
3.  Ran `netstat -ano | findstr :1420` to identify blocking process.
4.  Found PID `14196` listening on port 1420.
5.  Executed `taskkill /PID 14196 /F` to terminate the process.

## Result
User can now run `npm run tauri dev` successfully.
