@echo off
setlocal
pushd "%~dp0"
set "KEYLAB_NODE="
for /f "delims=" %%I in ('where node.exe 2^>nul') do if not defined KEYLAB_NODE set "KEYLAB_NODE=%%I"
if not defined KEYLAB_NODE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "KEYLAB_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined KEYLAB_NODE (
  echo Node.js was not found. Install Node.js and retry.
  popd
  exit /b 1
)
if not exist "node_modules\next\dist\bin\next" (
  echo Dependencies are missing. Run pnpm install after installing pnpm.
  popd
  exit /b 1
)
echo Starting KEYLAB. Open http://localhost:3000 in your browser.
echo Press Ctrl+C to stop the server.
"%KEYLAB_NODE%" "%~dp0scripts\next.mjs" dev
set "KEYLAB_EXIT=%ERRORLEVEL%"
popd
exit /b %KEYLAB_EXIT%
