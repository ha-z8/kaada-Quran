param([switch]$SkipDownload,[switch]$PortableOnly)
$ErrorActionPreference="Stop"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Write-Host "WIRD 6 - Windows x64 fully offline package builder" -ForegroundColor Green
if(-not (Get-Command node -ErrorAction SilentlyContinue)){throw "Node.js 22+ required only on the build PC."}
if(-not (Get-Command npm -ErrorAction SilentlyContinue)){throw "npm is missing."}
npm install
if($LASTEXITCODE -ne 0){throw "npm install failed"}
if(-not $SkipDownload){
 Write-Host "Downloading 6236 MP3 ayahs for Sudais and 6236 for Muhammad Ayyoub..."
 node tools/download-default-audio.mjs --all
 if($LASTEXITCODE -ne 0){throw "Audio download incomplete. Run the script again to resume."}
}
node tools/verify-offline.mjs
if($LASTEXITCODE -ne 0){throw "Both complete 6236-ayah recordings required."}
npm run prepare:icons
if($LASTEXITCODE -ne 0){throw "Could not build app icons."}
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"
Write-Host "Building the complete unpacked Windows app..."
npx electron-builder --win dir --x64
if($LASTEXITCODE -ne 0){throw "Unable to package standalone Windows app."}
node tools/zip-share.mjs --folder
if($LASTEXITCODE -ne 0){throw "Could not create fully offline folder ZIP64."}
if(-not $PortableOnly){
 Write-Host "Attempting installable and portable exe builds (large multi-GB files might exceed installer limits)..."
 npx electron-builder --win nsis portable --x64
 if($LASTEXITCODE -ne 0){Write-Warning "Exe packaging failed; complete portable folder ZIP was still built successfully."}
 else {
  node tools/zip-share.mjs
  if($LASTEXITCODE -ne 0){Write-Warning "Could not zip EXEs; they remain in dist/windows."}
 }
}
Get-ChildItem "dist\windows" -Filter "WIRD_Quran_*.exe" | ForEach-Object {
 Get-FileHash -Path $_.FullName -Algorithm SHA256 | Out-File ($_.FullName+".sha256.txt") -Encoding utf8
}
Write-Host "SUCCESS: Share dist/share/WIRD_Quran_Offline_Windows_x64_Folder.zip" -ForegroundColor Green
Write-Host "Recipient: unzip, open WIRD Quran folder, run WIRD Quran.exe. No Node.js or internet required."
Write-Host "If setup EXE was built, it is in dist/windows and may be shared instead."
