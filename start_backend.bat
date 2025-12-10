@echo off
echo ============================================================
echo Starting CryptoBeacon Backend Server
echo ============================================================
echo.

cd /d "%~dp0backend"

echo Activating virtual environment...
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo Warning: Virtual environment not found, using system Python
)

echo Loading environment variables from .env...
echo Starting FastAPI server with Uvicorn...
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
