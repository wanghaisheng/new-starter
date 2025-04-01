# PowerShell script to run the app in mock mode using npm instead of bun
# For Windows users who have issues with bun

# Set environment variables
$env:NEXT_PUBLIC_DATABASE_ENV = "mock"
$env:NEXT_PUBLIC_MOCK_DB_TYPE = "mock"
$env:NEXT_PUBLIC_DB_NAME = "app_database_mock"
$env:NEXT_PUBLIC_DB_VERSION = "1"
$env:NEXT_PUBLIC_USE_FAKE_INDEXEDDB = "true"
$env:NEXT_PUBLIC_DB_SYNC_ENABLED = "false"
$env:NEXT_PUBLIC_DB_DEBUG = "true"
$env:NEXT_PUBLIC_DB_LOG_LEVEL = "debug"

# Try to clean any existing database from localStorage and indexedDB
Write-Host "Checking for tools directory..."
if (-not (Test-Path -Path "tools")) {
    New-Item -ItemType Directory -Path "tools"
    Write-Host "Created tools directory"
}

# Verify schema first
Write-Host "`n===== Verifying database schemas ====="
npm run verify:schema

# Run the app with npm
Write-Host "`n===== Starting application in mock mode ====="
npm run dev:mock 