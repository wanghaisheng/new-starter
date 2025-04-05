# 任务文件移动脚本
# 用于重组任务目录结构，将相关任务文件移动到对应的任务目录

# 确保目标目录存在
$directories = @(
    "tasks\mobile-frontend",
    "tasks\database",
    "tasks\app-development", 
    "tasks\testing",
    "tasks\project-management"
)

# 创建目录（如果不存在）
foreach ($dir in $directories) {
    if (-not (Test-Path -Path $dir)) {
        Write-Host "Creating directory: $dir"
        New-Item -Path $dir -ItemType Directory -Force
    }
}

# 移动移动前端相关文件
$mobileFiles = @(
    "tasks\mobile-frontend-data-plan.md",
    "tasks\mobile-frontend-data-progress.md",
    "tasks\mobile-frontend-data-tasks.md",
    "tasks\mobile-frontend-data-tasks-progress.md"
)

foreach ($file in $mobileFiles) {
    if (Test-Path -Path $file) {
        Write-Host "Moving $file to tasks\mobile-frontend\"
        Move-Item -Path $file -Destination "tasks\mobile-frontend\" -Force
    } else {
        Write-Host "File not found: $file"
    }
}

# 移动移动测试文件
if (Test-Path -Path "tasks\mobile-testing-progress.md") {
    Write-Host "Moving tasks\mobile-testing-progress.md to tasks\testing\"
    Move-Item -Path "tasks\mobile-testing-progress.md" -Destination "tasks\testing\" -Force
}

# 移动测试摘要文件
if (Test-Path -Path "tasks\test-summary.md") {
    Write-Host "Moving tasks\test-summary.md to tasks\testing\"
    Move-Item -Path "tasks\test-summary.md" -Destination "tasks\testing\" -Force
}

# 移动项目进度文件
if (Test-Path -Path "tasks\project-progress.md") {
    Write-Host "Moving tasks\project-progress.md to tasks\project-management\"
    Move-Item -Path "tasks\project-progress.md" -Destination "tasks\project-management\" -Force
}

# 创建 README.md 文件在每个目录中
$readmeContents = @{
    "tasks\mobile-frontend\README.md" = "# 移动前端开发任务`n`n本目录包含移动前端开发相关的任务计划、进度报告和任务清单。";
    "tasks\database\README.md" = "# 数据库开发任务`n`n本目录包含数据库开发相关的任务计划、进度报告和任务清单。";
    "tasks\app-development\README.md" = "# 应用开发任务`n`n本目录包含应用开发相关的任务计划、进度报告和任务清单。";
    "tasks\testing\README.md" = "# 测试任务`n`n本目录包含测试相关的任务计划、进度报告和测试摘要。";
    "tasks\project-management\README.md" = "# 项目管理任务`n`n本目录包含项目管理相关的任务计划和项目进度报告。";
}

foreach ($file in $readmeContents.Keys) {
    Write-Host "Creating $file"
    Set-Content -Path $file -Value $readmeContents[$file]
}

# 打印完成消息
Write-Host "Done! Task files have been reorganized into subdirectories." 