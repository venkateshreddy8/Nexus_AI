@echo off
echo.
echo ========================================
echo   NEXUS AI - Intelligent Meeting Assistant
echo ========================================
echo.

:: Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

:: Check for Node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

echo [1/4] Creating Python virtual environment...
if not exist ".venv" (
    python -m venv .venv
)

echo [2/4] Installing backend dependencies...
cd backend
..\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt --quiet
cd ..

echo [3/4] Installing frontend dependencies...
cd frontend
call npm install --silent
cd ..

echo [4/4] Starting servers...
echo.
echo   Backend  -> http://localhost:8000
echo   Frontend -> http://localhost:3000
echo   API Docs -> http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop both servers.
echo.

:: Start backend in background
start "Nexus AI Backend" cmd /c "cd backend && ..\\.venv\\Scripts\\python.exe -m uvicorn main:app --reload --port 8000"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend (foreground)
cd frontend
call npm run dev
