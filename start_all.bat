@echo off
echo ========================================================
echo   CYPHER AI - English Conversational & Assessment Platform
echo ========================================================
echo.
echo Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "CYPHER Backend" cmd /k "backend\venv\Scripts\uvicorn backend.main:app --host 127.0.0.1 --port 8000"

echo Starting Frontend (React Vite on http://localhost:5173)...
start "CYPHER Frontend" cmd /k "cd frontend && npx vite --port 5173"

echo.
echo Both servers are launching! Open your browser at:
echo http://localhost:5173
echo ========================================================
pause
