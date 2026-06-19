[CmdletBinding()]
param(
    [int]$Port = 10005,
    [string]$Serial = '',
    [string]$AdbPath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-AdbPath {
    param([string]$ExplicitPath)

    if ($ExplicitPath) {
        if (-not (Test-Path -LiteralPath $ExplicitPath)) {
            throw "ADB was not found at '$ExplicitPath'."
        }

        return (Resolve-Path -LiteralPath $ExplicitPath).Path
    }

    $pathAdb = Get-Command adb.exe -ErrorAction SilentlyContinue
    if ($pathAdb) {
        return $pathAdb.Source
    }

    $mqdhAdb = 'C:\Program Files\Meta Quest Developer Hub\resources\bin\adb.exe'
    if (Test-Path -LiteralPath $mqdhAdb) {
        return $mqdhAdb
    }

    throw 'ADB was not found on PATH or in Meta Quest Developer Hub. Install MQDH or pass -AdbPath.'
}

function Invoke-Adb {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Adb,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & $Adb @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "adb $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Get-AdbDevices {
    param([string]$Adb)

    $rawDevices = & $Adb devices
    if ($LASTEXITCODE -ne 0) {
        throw "adb devices failed with exit code $LASTEXITCODE."
    }

    foreach ($line in ($rawDevices | Select-Object -Skip 1)) {
        $trimmed = $line.Trim()
        if (-not $trimmed) {
            continue
        }

        if ($trimmed -match '^(\S+)\s+(\S+)') {
            [pscustomobject]@{
                Serial = $Matches[1]
                Status = $Matches[2]
            }
        }
    }
}

if ($Port -lt 1 -or $Port -gt 65535) {
    throw 'Port must be between 1 and 65535.'
}

$adb = Resolve-AdbPath -ExplicitPath $AdbPath
Write-Host "Using ADB: $adb"

Invoke-Adb -Adb $adb -Arguments @('start-server')

$devices = @(Get-AdbDevices -Adb $adb)
$readyDevices = @($devices | Where-Object { $_.Status -eq 'device' })

if (-not $devices.Count) {
    Write-Error 'No ADB devices found. Connect the headset, enable developer mode, and accept the USB debugging prompt in the headset.'
    exit 2
}

if (-not $readyDevices.Count) {
    $deviceSummary = ($devices | ForEach-Object { "$($_.Serial)=$($_.Status)" }) -join ', '
    Write-Error "No authorized ADB device found. Current devices: $deviceSummary"
    exit 2
}

if ($Serial) {
    $selectedDevice = $readyDevices | Where-Object { $_.Serial -eq $Serial } | Select-Object -First 1
    if (-not $selectedDevice) {
        $deviceSummary = ($devices | ForEach-Object { "$($_.Serial)=$($_.Status)" }) -join ', '
        Write-Error "Requested serial '$Serial' is not connected and authorized. Current devices: $deviceSummary"
        exit 2
    }
} elseif ($readyDevices.Count -eq 1) {
    $selectedDevice = $readyDevices[0]
} else {
    $deviceSummary = ($readyDevices | ForEach-Object { $_.Serial }) -join ', '
    Write-Error "Multiple authorized ADB devices found: $deviceSummary. Re-run with -Serial <device-serial>."
    exit 2
}

$deviceArgs = @('-s', $selectedDevice.Serial)
Invoke-Adb -Adb $adb -Arguments ($deviceArgs + @('reverse', "tcp:$Port", "tcp:$Port"))

$portOpen = $false
try {
    $connection = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    $portOpen = [bool]$connection
} catch {
    $portOpen = $false
}

Write-Host "ADB device: $($selectedDevice.Serial)"
Write-Host "Reverse active: headset tcp:$Port -> computer tcp:$Port"
Write-Host "Open this in the headset browser: http://localhost:$Port/"

if (-not $portOpen) {
    Write-Warning "No local server answered on 127.0.0.1:$Port yet. Start your local web server before loading the URL."
}
