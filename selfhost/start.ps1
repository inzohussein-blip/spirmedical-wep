# 🖥️ تشغيلُ الموقع بلا Docker على Windows (selfhost/README.md).
#   powershell -ExecutionPolicy Bypass -File selfhost\start.ps1           ← يبني ثمّ يشغّل على المنفذ 3000
#   powershell -ExecutionPolicy Bypass -File selfhost\start.ps1 -NoBuild  ← يشغّل آخرَ بناء
# يحتاج Node 24 و`.env.production` في جذر المستودع (انسخه من Vercel).
param([switch]$NoBuild)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

if (-not (Test-Path '.env.production')) {
  Write-Error 'لا يوجد .env.production في جذر المستودع — انسخ متغيّرات الإنتاج من Vercel (selfhost/README.md)'
}
$major = [int]((node -p "process.versions.node.split('.')[0]") 2>$null)
if ($major -lt 24) { Write-Error "يلزم Node 24 أو أحدث (الموجود: $(node -v))" }

if (-not $NoBuild) {
  npm ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  $env:NEXT_OUTPUT = 'standalone'; $env:NEXT_TELEMETRY_DISABLED = '1'
  npm run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  # النسخةُ المستقلّة لا تحمل public ولا الملفّاتِ الساكنة
  Remove-Item -Recurse -Force '.next/standalone/public', '.next/standalone/.next/static' -ErrorAction SilentlyContinue
  Copy-Item -Recurse 'public' '.next/standalone/public'
  Copy-Item -Recurse '.next/static' '.next/standalone/.next/static'
}

# المتغيّراتُ للخادم عند التشغيل
Get-Content '.env.production' | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
    [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2].Trim('"').Trim("'"), 'Process')
  }
}
$env:NODE_ENV = 'production'
if (-not $env:PORT) { $env:PORT = '3000' }
$env:HOSTNAME = '127.0.0.1'
Write-Host "الموقع على http://127.0.0.1:$($env:PORT) — والنفقُ (cloudflared) يوصله إلى origin.spir-medical.com"
node .next/standalone/server.js
