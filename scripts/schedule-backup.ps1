<#
.SYNOPSIS
  Automated Daily Backup via Windows Task Scheduler
.DESCRIPTION
  Creates a scheduled task named "MCU_UMS_Database_Backup" running daily at 02:00 AM.
#>

$TaskName = "MCU_UMS_Database_Backup"
$ProjectDir = (Resolve-Path "$PSScriptRoot\..").Path
$ActionScript = "$ProjectDir\scripts\backup-database.ts"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  MCU UMS Database Backup Scheduler                       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$npxPath = (Get-Command "npx.cmd" -ErrorAction SilentlyContinue).Source
if (-not $npxPath) {
    $npxPath = "C:\Program Files\nodejs\npx.cmd"
}

$Action = New-ScheduledTaskAction -Execute $npxPath -Argument "tsx `"$ActionScript`"" -WorkingDirectory $ProjectDir
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00AM"
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Automated Daily Backup for MCU Faculty of Buddhism Database" -ErrorAction Stop | Out-Null
    Write-Host "[SUCCESS] Task scheduled successfully!" -ForegroundColor Green
    Write-Host "  Task Name: $TaskName" -ForegroundColor Green
    Write-Host "  Trigger: Daily at 02:00 AM" -ForegroundColor Green
    Write-Host "  Location: $ProjectDir\backups" -ForegroundColor Green
} catch {
    Write-Warning "Could not register Task Scheduler: $_"
    Write-Host "To run backup manually at any time: npm run db:backup" -ForegroundColor Yellow
}
