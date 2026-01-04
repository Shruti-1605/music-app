@echo off
echo Starting Music Streaming App...

echo.
echo Starting Backend...
start cmd /k "cd Backend && python app.py"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend...
start cmd /k "cd Frontend && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
pause