@echo off
REM Start frontend dev server in one window
start cmd /k "cd /d C:\Users\Vivo7\Desktop\kek1\frontend && npm start"

REM Start backend FastAPI server in another window
start cmd /k "cd /d C:\Users\Vivo7\Desktop\kek1\backend && python -m uvicorn server:app --host 127.0.0.1 --port 8000"

echo.
echo ============================================
echo Starting Astra Web Studio Project
echo ============================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://127.0.0.1:8000/api/
echo API Docs: http://127.0.0.1:8000/docs
echo.
echo Press CTRL+C in any terminal to stop that server
echo Close this window to exit
echo.
pause
