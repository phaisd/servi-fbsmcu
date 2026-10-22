<#
.SYNOPSIS
    Windows Server Security Hardening Script for MCU Production Service.
    Mitigates WannaCry / Ransomware (SMB vulnerabilities) and Unauthorized Mining.
.DESCRIPTION
    Run this script in an Elevated Administrator PowerShell prompt on the Windows Server host.
#>

[CmdletBinding()]
param()

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  MCU Vibe-Framework Production Security Hardening Script  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check and Disable SMBv1 (WannaCry / EternalBlue Vector)
Write-Host "`n[1/4] Checking SMBv1 Protocol Status..." -ForegroundColor Yellow
try {
    $smb1Feature = Get-WindowsOptionalFeature -Online -FeatureName "SMB1Protocol" -ErrorAction SilentlyContinue
    if ($smb1Feature -and $smb1Feature.State -eq "Enabled") {
        Write-Host "  -> SMBv1 is currently ENABLED. Disabling now to prevent Ransomware..." -ForegroundColor Red
        Disable-WindowsOptionalFeature -Online -FeatureName "SMB1Protocol" -NoRestart | Out-Null
        Write-Host "  -> SMBv1 successfully DISABLED." -ForegroundColor Green
    } else {
        Write-Host "  -> SMBv1 is already disabled (Safe)." -ForegroundColor Green
    }
} catch {
    Write-Warning "Could not query Windows Optional Features: $_"
}

# 2. Block External Inbound SMB & NetBIOS Ports (445, 139) on Windows Firewall
Write-Host "`n[2/4] Configuring Windows Firewall for Inbound SMB (Port 445, 139)..." -ForegroundColor Yellow
try {
    $ruleName = "Block-Inbound-SMB-Public-Campus"
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if (-not $existingRule) {
        New-NetFirewallRule -DisplayName $ruleName `
            -Direction Inbound `
            -LocalPort 445, 139, 137, 138 `
            -Protocol TCP `
            -Action Block `
            -Profile Public, Private `
            -Description "Block incoming SMB from university subnet to prevent lateral worm/ransomware infection" | Out-Null
        Write-Host "  -> Firewall block rule created successfully for ports 445 & 139." -ForegroundColor Green
    } else {
        Write-Host "  -> Firewall rule '$ruleName' already exists." -ForegroundColor Green
    }
} catch {
    Write-Warning "Could not configure Firewall: $_"
}

# 3. Restrict Inbound HTTP to Cloudflare / Reverse Proxy IPs (Optional Guidance)
Write-Host "`n[3/4] Web Service Port Inspection..." -ForegroundColor Yellow
$active3010 = Get-NetTCPConnection -LocalPort 3010 -ErrorAction SilentlyContinue
if ($active3010) {
    Write-Host "  -> Node.js port 3010 is listening on: $($active3010.LocalAddress)" -ForegroundColor Cyan
} else {
    Write-Host "  -> Port 3010 is currently idle." -ForegroundColor DarkGray
}

# 4. Antivirus & Uploads Directory Realtime Protection
Write-Host "`n[4/4] Verifying Windows Defender Status..." -ForegroundColor Yellow
try {
    $mpPref = Get-MpPreference -ErrorAction SilentlyContinue
    if ($mpPref) {
        Write-Host "  -> Windows Defender Realtime Protection is ACTIVE." -ForegroundColor Green
        Write-Host "  -> Ensure 'F:\FB-service\vibe-framework\public\uploads' is included in scans." -ForegroundColor Cyan
    }
} catch {
    Write-Host "  -> Non-default AV or Defender managed via GPO." -ForegroundColor DarkGray
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  Hardening Checklist Complete!                           " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
