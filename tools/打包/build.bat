@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

rem ============================================================
rem  仙路长青 · 一键打包（纯游戏内容）
rem  双击本文件即可。产物在「打包输出」目录。
rem ============================================================

cd /d "%~dp0\..\.."

echo.
echo   ============================================================
echo     仙路长青 - 一键打包（纯游戏内容）
echo   ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo   [失败] 找不到 node。
    echo.
    echo   这个打包器用 node 内置模块手写 zip，不装任何依赖，
    echo   但仍需 node 本身。请先到 https://nodejs.org 装一个 LTS 版，
    echo   装完再双击本文件。
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODEV=%%v
echo   node: !NODEV!
echo   源目录: %CD%
echo.

node "tools\打包\build.cjs"
set RC=%ERRORLEVEL%

echo.
if %RC% neq 0 (
    echo   [失败] 打包未完成，退出码 %RC%。
) else (
    echo   [完成] 压缩包在「打包输出」目录。
    echo          解压后用 Chrome/Edge 打开 仙侠.html 即可玩。
)
echo.
pause
exit /b %RC%
