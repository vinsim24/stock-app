@echo off
REM Auto Commit and Deploy Script for Windows
REM This script will commit your changes and push to GitHub,
REM which will automatically trigger the Docker build and push via GitHub Actions

echo 🚀 Auto Commit and Deploy Script
echo ======================================

REM Check if there are any changes (simplified check)
git diff --quiet && git diff --staged --quiet
if %errorlevel% == 0 (
    echo ⚠️  No changes detected. Nothing to commit.
    exit /b 0
)

REM Get commit message from user or use default
if "%~1"=="" (
    set /p COMMIT_MSG="💬 Enter commit message (or press Enter for auto-generated message): "
    if "!COMMIT_MSG!"=="" (
        for /f "tokens=1-5 delims=/ " %%a in ('date /t') do set mydate=%%c-%%a-%%b
        for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a:%%b
        set COMMIT_MSG=chore: update application - !mydate! !mytime!
    )
) else (
    set COMMIT_MSG=%~1
)

echo 📝 Staging changes...
git add .

echo 💾 Committing changes...
git commit -m "%COMMIT_MSG%"

echo 📤 Pushing to GitHub...
git push origin main

echo ✅ Successfully pushed to GitHub!

REM Check what type of workflow will run
git diff --name-only HEAD~1 HEAD > temp_changes.txt
set "CODE_CHANGED=false"
for /f "tokens=*" %%i in (temp_changes.txt) do (
    set "file=%%i"
    echo !file! | findstr /v /i "\.md$ \.txt$ ^docs/ ^\.gitignore$ ^LICENSE$ ^deploy\." >nul
    if !errorlevel! equ 0 (
        set "CODE_CHANGED=true"
    )
)
del temp_changes.txt

if "%CODE_CHANGED%"=="true" (
    echo 🔄 GitHub Actions will now automatically:
    echo    • Build Docker images
    echo    • Push to Docker Hub  
    echo    • Tag with commit SHA
) else (
    echo 📝 Documentation-only changes detected:
    echo    • Will run documentation validation
    echo    • Docker builds skipped ^(saves time and resources^)
    echo    • Next code commit will trigger Docker builds
)

echo.
echo 📊 Monitor progress at:
echo    https://github.com/vinsim24/stock-app/actions
echo.
echo 🎉 Deployment pipeline started!
