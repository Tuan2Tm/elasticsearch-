# Docker Compose Helper Script
# Sử dụng script này để chạy docker-compose với các môi trường khác nhau

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "test")]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("up", "down", "restart", "logs", "ps", "stop", "start")]
    [string]$Action
)

$envFile = ".env.$Environment"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ File $envFile không tồn tại!" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Sử dụng môi trường: $Environment" -ForegroundColor Cyan
Write-Host "📄 File env: $envFile" -ForegroundColor Cyan

switch ($Action) {
    "up" {
        Write-Host "🚀 Khởi động services..." -ForegroundColor Green
        docker-compose --env-file $envFile up -d
    }
    "down" {
        Write-Host "🛑 Dừng và xóa services..." -ForegroundColor Yellow
        docker-compose --env-file $envFile down
    }
    "restart" {
        Write-Host "🔄 Khởi động lại services..." -ForegroundColor Yellow
        docker-compose --env-file $envFile restart
    }
    "logs" {
        Write-Host "📋 Hiển thị logs..." -ForegroundColor Cyan
        docker-compose --env-file $envFile logs -f
    }
    "ps" {
        Write-Host "📊 Trạng thái services..." -ForegroundColor Cyan
        docker-compose --env-file $envFile ps
    }
    "stop" {
        Write-Host "⏸️  Dừng services..." -ForegroundColor Yellow
        docker-compose --env-file $envFile stop
    }
    "start" {
        Write-Host "▶️  Khởi động services..." -ForegroundColor Green
        docker-compose --env-file $envFile start
    }
}

Write-Host "✅ Hoàn thành!" -ForegroundColor Green

