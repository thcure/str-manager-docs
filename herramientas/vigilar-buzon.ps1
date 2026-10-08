# vigilar-buzon.ps1 - Despertador del buzon de mensajes entre actores (Arquitecto, 2026-10-08)
#
# Lee interno/mensajes.json (repositorio publico str-manager-docs) y, por cada mensaje en estado
# 'pendiente' que todavia no se haya avisado, deja en el chat destinatario SOLO una frase fija:
#   "Revisa el buzon (interno/mensajes.json): tienes el mensaje pendiente M-n."
# Nunca copia el contenido del mensaje al chat (el repositorio es publico).
# El chat de cada destinatario sale de interno/destinatarios.json (lo mantiene el Arquitecto).
#
# No usa Claude para revisar: solo llama a la CLI (claude -p ... --cloud <sesion>) cuando hay un
# mensaje nuevo. La primera corrida marca como avisados los mensajes que ya existen, sin avisar.
#
# Carpeta: C:\Users\<usuario>\Downloads\str-instr-cola\buzon\
#   vigilar-buzon.ps1  este script
#   lanzar-buzon.vbs   lo corre sin mostrar ventana (tarea de Windows "STR buzon", cada 3 minutos)
#   notificados.txt    ids ya avisados (borrarlo hace que la proxima corrida reinicie sin avisar)
#   buzon.log          una linea por aviso o error
#
# Manual: powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\Downloads\str-instr-cola\buzon\vigilar-buzon.ps1"

$ErrorActionPreference = 'Continue'
$Base    = Join-Path $HOME 'Downloads\str-instr-cola\buzon'
$Estado  = Join-Path $Base 'notificados.txt'
$LogFile = Join-Path $Base 'buzon.log'
$Lock    = Join-Path $Base '.corriendo'
$Claude  = Join-Path $HOME '.local\bin\claude.exe'
$Raw     = 'https://raw.githubusercontent.com/thcure/str-manager-docs/main/interno'

New-Item -ItemType Directory -Force $Base | Out-Null
function Log([string]$t) { Add-Content -Path $LogFile -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $t) }

# Candado: evita dos corridas a la vez (se ignora si tiene mas de 10 minutos)
if ((Test-Path $Lock) -and (((Get-Date) - (Get-Item $Lock).LastWriteTime).TotalMinutes -lt 10)) { exit 0 }
Set-Content -Path $Lock -Value (Get-Date)

try {
    $t = [DateTime]::UtcNow.Ticks
    try {
        $msgs = (Invoke-RestMethod -Uri "$Raw/mensajes.json?t=$t" -UseBasicParsing).mensajes
        $dest = (Invoke-RestMethod -Uri "$Raw/destinatarios.json?t=$t" -UseBasicParsing).destinatarios
    } catch {
        Log ('ERROR al leer GitHub: ' + $_.Exception.Message)
        return
    }

    if (-not (Test-Path $Estado)) {
        $msgs | ForEach-Object { $_.id } | Set-Content -Path $Estado
        Log ("Inicio: " + @($msgs).Count + " mensajes existentes marcados como avisados, sin avisar.")
        return
    }

    $avisados = @(Get-Content -Path $Estado)
    foreach ($m in $msgs) {
        $id = [string]$m.id
        if ($id -notmatch '^M-\d+$') { continue }
        if ($m.estado -ne 'pendiente') { continue }
        if ($avisados -contains $id) { continue }

        $d = $dest | Where-Object { $_.nombre -eq $m.para } | Select-Object -First 1
        if (-not $d -or -not $d.sesion) { Log "$id sin sesion registrada para el destinatario; no se avisa."; continue }
        $sesion = [string]$d.sesion
        if ($sesion -notmatch '^(cse|session)_[A-Za-z0-9]+$') { Log "$id sesion con formato invalido; no se avisa."; continue }

        $texto = "Revisa el buzon (interno/mensajes.json): tienes el mensaje pendiente $id."
        $salida = & $Claude -p $texto --cloud $sesion --output-format json 2>&1 | Out-String
        if ($salida -match '"ok"\s*:\s*true') {
            Add-Content -Path $Estado -Value $id
            Log "$id avisado a $($d.nombre)."
        } else {
            Log ("$id ERROR al avisar a $($d.nombre): " + ($salida -replace '\s+', ' ').Trim())
        }
    }
} finally {
    Remove-Item -Path $Lock -Force -ErrorAction SilentlyContinue
}
