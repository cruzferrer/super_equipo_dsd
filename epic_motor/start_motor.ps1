# Script de PowerShell para iniciar el Motor EPiC
# Uso: .\start_motor.ps1

Write-Host "Iniciando Motor EPiC..." -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "main.py")) {
    Write-Host "Error: No se encuentra main.py. Asegurate de estar en el directorio epic_motor" -ForegroundColor Red
    exit 1
}

# Iniciar uvicorn
python -m uvicorn main:app --reload --port 8000

# Made with Bob
