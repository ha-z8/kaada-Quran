param([switch]$SkipDownload,[switch]$PortableOnly)
$ErrorActionPreference="Stop"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location ..
Write-Host "==============================================" -ForegroundColor Green
Write-Host " WIRD 6 - Windows Offline Builder (x64)"
Write-Host "=============================================="
if(-not (Get-Command node -ErrorAction SilentlyContinue)){throw "Node.js 22+ required on the BUILD computer. Install Node.js first."}
if(-not (Get-Command npm -ErrorAction SilentlyContinue)){throw "npm is missing."}
node --version
Write-Host "Installing build dependencies..."
npm install
if($LASTEXITCODE -ne 0){throw "npm install failed"}
if(-not $SkipDownload){
 Write-Host "Downloading all 6236 ayahs for Sudais and Muhammad Ayyoub..."
 node tools/download-default-audio.mjs --all
 if($LASTEXITCODE -ne 0){throw "Audio download incomplete; rerun this script to resume."}
}
node tools/verify-offline.mjs
if($LASTEXITCODE -ne 0){throw "Default two complete audio collections are not present; cannot build offline package."}
npm run prepare:icons
if($LASTEXITCODE -ne 0){throw "Windows icon preparation failed"}
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"
if($PortableOnly){npx electron-builder --win portable --x64}
else{npx electron-builder --win nsis portable --x64}
if($LASTEXITCODE -ne 0){throw "electron-builder failed"}
New-Item -ItemType Directory -Force "dist\share" | Out-Null
$files=Get-ChildItem "dist\windows" -Filter "*.exe" | Where-Object { $_.Name -like "WIRD_Quran_*" }
foreach($f in $files){
 $dst="dist\share\"+$f.Name+".zip"
 Write-Host "Creating shareable ZIP: $dst"
 Compress-Archive -LiteralPath $f.FullName -DestinationPath $dst -Force -CompressionLevel NoCompression
 if(-not (Test-Path $dst)){throw "ZIP creation failed"}
 Get-FileHash -Path $f.FullName -Algorithm SHA256 | Out-File ($f.FullName+".sha256.txt") -Encoding utf8
}
Write-Host "SUCCESS! Windows offline installers in dist\windows; shareable ZIPs in dist\share" -ForegroundColor Green
Write-Host "The recipient needs no Node.js or internet. Windows x64 is required."node tools/zip-share.mjs
if($LASTEXITCODE -ne 0){throw "ZIP64 shareable packages could not be created"}
Get-ChildItem "dist\\windows" -Filter "WIRD_Quran_*.exe" | ForEach-Object {
  Get-FileHash -Path $_.FullName -Algorithm SHA256 | Out-File ($_.FullName + ".sha256.txt") -Encoding utf8
}
Write-Host "SUCCESS! Windows offline installers in dist\windows; shareable ZIPs in dist\share" -ForegroundColor Green
Write-Host "The recipient needs no Node.js or internet. Windows x64 is required."
