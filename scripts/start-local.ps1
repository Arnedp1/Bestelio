# Volledige lokale start: database + schema + seed + dev server
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "Starting PostgreSQL (Docker)..." -ForegroundColor Cyan
docker compose up db -d

if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "Created .env from .env.example" -ForegroundColor Yellow
}

Write-Host "Database setup (push + seed)..." -ForegroundColor Cyan
npm run db:setup

Write-Host "Starting Next.js dev server..." -ForegroundColor Cyan
npm run dev
