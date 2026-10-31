param([switch]$SkipDownload,[switch]$PortableOnly)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Write-Host "WIRD 6 - Windows x64 fully offline build" -ForegroundColor Green
if(-not (Get-Command node -ErrorAction SilentlyContinue)){throw "Install Node.js 22+ on the build machine first."}
if(-not (Get-Command npm -ErrorAction SilentlyContinue)){throw "npm is missing."}
npm install
if($LASTEXITCODE -ne 0){throw "npm install failed"}
if(-not $SkipDownload){
  Write-Host "Downloading the complete Quran for Sudais and Muhammad Ayyoub (12,472 MP3 files)."
  node tools/download-default-audio.mjs --all
  if($LASTEXITCODE -ne 0){throw "Audio download was incomplete. Re-run to resume."}
}
node tools/verify-offline.mjs
if($LASTEXITCODE -ne 0){throw "Two full recordings are required before building."}
npm run prepare:icons
if($LASTEXITCODE -ne 0){throw "Brand icon generation failed"}
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
if($PortableOnly){npx electron-builder --win portable --x64}
else{npx electron-builder --win nsis portable --x64}
if($LASTEXITCODE -ne 0){throw "Windows build failed"}
node tools/zip-share.mjs
if($LASTEXITCODE -ne 0){throw "ZIP64 packaging failed"}
Get-ChildItem "dist\windows" -Filter "WIRD_Quran_*.exe" | ForEach-Object {
  Get-FileHash -Path $_.FullName -Algorithm SHA256 | Out-File ($_.FullName + ".sha256.txt") -Encoding utf8
}
Write-Host "SUCCESS: installable .exe files in dist/windows, shareable .zip files in dist/share." -ForegroundColor Green
Write-Host "Recipients can run the files without Node.js or internet on Windows x64."
