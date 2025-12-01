@echo off
REM Start frontend dev server
start cmd /k "cd /d C:\Users\Vivo7\kek1\frontend && npm start"

REM Start backend (no MongoDB needed - uses JSON file)
start cmd /k "cd /d C:\Users\Vivo7\kek1\backend && python -m uvicorn server:app --host 127.0.0.1 --port 8000"

echo.
echo Frontend: http://localhost:3000
echo Backend:  http://127.0.0.1:8000/api/
echo.
echo Contact form now saves to backend/contacts.json (no MongoDB needed!)
echo.
pause
