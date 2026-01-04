@echo off
echo Starting Music Streaming App...

echo.
echo Starting Backend...
start cmd /k "cd Backend && python simple_app.py"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend...
start cmd /k "cd Frontend-new && npm run dev"

echo.
echo Both servers starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo Login: admin/admin123
pause