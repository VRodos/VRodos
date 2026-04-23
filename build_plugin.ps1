# Build Script for VRodos Plugin Distribution

$buildDir = "build_dist"
$pluginName = "VRodos"
$targetDir = "$buildDir\$pluginName"

# 1. Clean previous build
if (Test-Path $buildDir) {
    Remove-Item $buildDir -Recurse -Force
}
New-Item -ItemType Directory -Path $targetDir | Out-Null

# 2. Copy Files (Excluding Dev Tools)
Write-Host "Copying files..." -ForegroundColor Cyan

# List of items to copy
$items = @(
    "assets",
    "templates",
    "services",
    "includes",
    "runtime",
    "VRodos.php",
    "readme.txt",
    "LICENSE"
)

foreach ($item in $items) {
    if (Test-Path $item) {
        Copy-Item $item -Destination $targetDir -Recurse
    }
}

# 2b. Remove generated or local-only directories from the distributable
$pathsToRemove = @(
    "$targetDir\services\networked-aframe\node_modules",
    "$targetDir\runtime\build"
)

foreach ($pathToRemove in $pathsToRemove) {
    if (Test-Path $pathToRemove) {
        Remove-Item $pathToRemove -Recurse -Force
    }
}

# 3. Create Zip
$zipFile = "$buildDir\VRodos_v2.5_Modernized.zip"
Write-Host "Zipping to $zipFile..." -ForegroundColor Cyan

Compress-Archive -Path "$targetDir\*" -DestinationPath $zipFile

Write-Host "Build Complete! Plugin is ready at $zipFile" -ForegroundColor Green
