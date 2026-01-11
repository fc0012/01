@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   VERTEX 精简版 - 上传到新仓库
echo ========================================
echo.

:: 检查是否提供了仓库地址
if "%~1"=="" (
    echo 用法: upload-to-new-repo.bat ^<新仓库地址^>
    echo.
    echo 示例:
    echo   upload-to-new-repo.bat https://github.com/username/vertex-lite.git
    echo   upload-to-new-repo.bat git@github.com:username/vertex-lite.git
    echo.
    set /p REPO_URL="请输入新仓库地址: "
) else (
    set REPO_URL=%~1
)

if "!REPO_URL!"=="" (
    echo 错误: 未提供仓库地址
    exit /b 1
)

echo.
echo 新仓库地址: !REPO_URL!
echo.

:: 删除旧的 git 历史
echo [1/6] 删除旧的 git 历史...
if exist ".git" (
    rmdir /s /q .git
)

:: 删除不需要的文件
echo [2/6] 清理不需要的文件...
if exist ".kiro" rmdir /s /q .kiro
if exist "package-lock.json" del /f /q package-lock.json
if exist ".gitlab-ci.yml" del /f /q .gitlab-ci.yml
if exist ".github" rmdir /s /q .github

:: 初始化新仓库
echo [3/6] 初始化新的 git 仓库...
git init

:: 添加所有文件
echo [4/6] 添加所有文件...
git add -A

:: 提交
echo [5/6] 创建初始提交...
git commit -m "VERTEX 精简版 - 仅保留 qBittorrent 和全部 PT 站点"

:: 添加远程仓库并推送
echo [6/6] 推送到远程仓库...
git remote add origin !REPO_URL!
git branch -M main
git push -u origin main

echo.
echo ========================================
echo   上传完成!
echo ========================================
echo.
echo 你的精简版 VERTEX 已上传到: !REPO_URL!
echo.

pause
