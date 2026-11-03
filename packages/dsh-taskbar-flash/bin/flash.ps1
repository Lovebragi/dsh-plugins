#Requires -Version 3.0
<#
.SYNOPSIS
    Thin launcher for bin\flash.exe (the real flasher).

.DESCRIPTION
    The flashing itself lives in a compiled .exe on purpose: DSH sandboxes can force PowerShell
    into ConstrainedLanguage mode, where Add-Type / P-Invoke are blocked. This wrapper only
    forwards arguments, so it works under any language mode.

.PARAMETER Count
    Number of flashes (0 = keep flashing until the window is activated).

.PARAMETER Now
    Flash immediately even if the DSH window is in the foreground (invisible in that case).

.PARAMETER Stop
    Cancel an ongoing flash instead of starting one.

.PARAMETER Title
    Window-title substring used to locate the DSH window. Defaults to "DeepSeek Harness".

.PARAMETER DelaySeconds
    Wait this long before the first attempt.

.PARAMETER RetrySeconds
    How long to keep waiting for the user to switch away (default 60).

.PARAMETER LogFile
    JSON outcome log. Defaults to <package>\flash.log.
#>
[CmdletBinding()]
param(
    [int]$Count = 5,
    [switch]$Now,
    [switch]$Stop,
    [string]$Title = 'DeepSeek Harness',
    [int]$DelaySeconds = 0,
    [int]$RetrySeconds = 60,
    [string]$LogFile = ''
)

if (-not $LogFile) {
    $LogFile = Join-Path (Split-Path -Parent $PSCommandPath) '..\flash.log'
}

if ($DelaySeconds -gt 0) { Start-Sleep -Seconds $DelaySeconds }

$exe = Join-Path $PSScriptRoot 'flash.exe'
if (-not (Test-Path $exe)) {
    [pscustomobject]@{ ok = $false; reason = "missing:$exe" } | ConvertTo-Json -Compress
    exit 1
}

$argv = @('--count', "$Count", '--retry', "$RetrySeconds", '--title', $Title, '--log', $LogFile)
if ($Now) { $argv += '--now' }
if ($Stop) { $argv += '--stop' }

& $exe @argv
exit $LASTEXITCODE
