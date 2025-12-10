@echo off
echo ============================================================
echo Starting CryptoBeacon Frontend Development Server
echo ============================================================
echo.

cd /d "%~dp0frontend"

echo Checking for node_modules...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo Starting Vite development server...
echo Frontend will be available at http://localhost:5173/
echo.

npm run dev

pause
