@echo off
echo ====================================
echo   Microfrontend Development Server
echo ====================================
echo.

if "%1"=="install" (
    echo Installing dependencies for all applications...
    echo.
    
    echo [1/5] Installing Shared Library...
    cd shared
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install shared dependencies
        pause
        exit /b 1
    )
    
    echo [2/5] Building Shared Library...
    call npm run build
    if errorlevel 1 (
        echo ERROR: Failed to build shared library
        pause
        exit /b 1
    )
    cd ..
    
    echo [3/5] Installing Container App...
    cd container
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install container dependencies
        pause
        exit /b 1
    )
    cd ..
    
    echo [4/5] Installing Products App...
    cd products
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install products dependencies
        pause
        exit /b 1
    )
    cd ..
    
    echo [5/5] Installing Cart App...
    cd cart
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install cart dependencies
        pause
        exit /b 1
    )
    cd ..
    
    echo [6/6] Installing Auth App...
    cd auth
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install auth dependencies
        pause
        exit /b 1
    )
    cd ..
    
    echo.
    echo ✅ All dependencies installed successfully!
    echo.
    echo To start the development servers, run:
    echo   start-dev.bat
    echo.
    pause
    exit /b 0
)

echo Starting all microfrontend applications...
echo.
echo This will open 5 command windows:
echo - Shared Library (Port: Building)
echo - Container App (Port: 3000) - Main Application
echo - Products App (Port: 3001) 
echo - Cart App (Port: 3002)
echo - Auth App (Port: 3003)
echo.

echo Press any key to continue...
pause >nul

echo.
echo Starting applications...

:: Start Shared Library
start "Shared Library" cmd /k "cd shared && npm run dev"

:: Wait a moment for shared to start
timeout /t 3 /nobreak >nul

:: Start Container (Main App)
start "Container App (Main)" cmd /k "cd container && npm start"

:: Start Products App
start "Products App" cmd /k "cd products && npm run dev"

:: Start Cart App  
start "Cart App" cmd /k "cd cart && npm start"

:: Start Auth App
start "Auth App" cmd /k "cd auth && npm start"

echo.
echo ✅ All applications are starting...
echo.
echo Wait 30-60 seconds for everything to load, then open:
echo 🌐 Main Application: http://localhost:3000
echo.
echo Individual apps (for testing):
echo   📦 Container: http://localhost:3000
echo   🛍️ Products: http://localhost:3001
echo   🛒 Cart: http://localhost:3002  
echo   🔐 Auth: http://localhost:3003
echo.
echo To stop all servers, close all command windows.
echo.
echo If you encounter issues:
echo   1. Check that all 5 windows opened successfully
echo   2. Wait for "compiled successfully" messages
echo   3. Check browser console for errors
echo.
pause