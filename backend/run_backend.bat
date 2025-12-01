@echo off
echo Starting FastAPI Backend Server...
echo.
python -m uvicorn server:app --host 127.0.0.1 --port 8000
pause
