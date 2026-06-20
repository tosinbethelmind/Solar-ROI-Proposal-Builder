@echo off
echo =======================================================
echo   SolarQuotePro -- Voiced Demo Video Automation Runner
echo =======================================================
echo.
echo IMPORTANT: Please make sure your system speakers or headphones
echo are turned ON. The browser will use the Web Speech API to speak
echo and narrate each action during the automated walkthrough!
echo.
echo Step 1: Running E2E Walkthrough in Headed Mode...
echo.
npx playwright test tests/e2e/demo_recorder.public.spec.ts --headed

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Walkthrough demo script returned an error.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =======================================================
echo   SUCCESS: Walkthrough Demo Complete!
echo =======================================================
echo.
echo The recorded video has been saved to:
for /r ".\test-results" %%f in (*.webm) do (
    echo %%f
)
echo.
pause
