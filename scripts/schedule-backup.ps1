<#
.SYNOPSIS
  ตั้งเวลาให้ Windows Task Scheduler รันการสำรองข้อมูลอัตโนมัติทุกวัน
.DESCRIPTION
  สร้าง Scheduled Task ชื่อ "MCU_UMS_Database_Backup" รันเวลา 02:00 น. ของทุกวัน
#>

$TaskName = "MCU_UMS_Database_Backup"
$ProjectDir = (Resolve-Path "$PSScriptRoot\..").Path
$ActionScript = "$ProjectDir\scripts\backup-database.ts"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ตั้งค่างานสำรองข้อมูลอัตโนมัติ (Windows Task Scheduler)" -ForegroundColor Cyan
Write-Host "  มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย • คณะพุทธศาสตร์" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# ตรวจสอบ npx.cmd
$npxPath = (Get-Command "npx.cmd" -ErrorAction SilentlyContinue).Source
if (-not $npxPath) {
    $npxPath = "C:\Program Files\nodejs\npx.cmd"
}

$Action = New-ScheduledTaskAction -Execute $npxPath -Argument "tsx `"$ActionScript`"" -WorkingDirectory $ProjectDir
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00AM"
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    # ลบงานเดิมหากมีอยู่
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Automated Daily Backup for MCU Faculty of Buddhism Database" | Out-Null
    Write-Host "✓ ตั้งเวลางานสำรองข้อมูลอัตโนมัติเรียบร้อยแล้ว!" -ForegroundColor Green
    Write-Host "  - ชื่องาน: $TaskName" -ForegroundColor Green
    Write-Host "  - เวลาทำงาน: ทุกวัน เวลา 02:00 น." -ForegroundColor Green
    Write-Host "  - ไฟล์สำรองจัดเก็บที่: $ProjectDir\backups" -ForegroundColor Green
} catch {
    Write-Warning "ไม่สามารถลงทะเบียน Task Scheduler ได้อัตโนมัติ (อาจต้องรัน PowerShell ด้วยสิทธิ์ Administrator)"
    Write-Host "ท่านสามารถรันคำสั่งสำรองข้อมูลด้วยตนเองได้ทุกเมื่อโดยพิมพ์: npm run db:backup" -ForegroundColor Yellow
}
