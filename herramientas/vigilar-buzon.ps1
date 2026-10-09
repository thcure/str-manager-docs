# vigilar-buzon.ps1 - Despertador de los chats (Arquitecto, 2026-10-08; v2 con veredictos y cola)
#
# Revisa tres fuentes sin usar Claude y, por cada evento nuevo, deja en el chat destinatario SOLO una
# frase fija (nunca el contenido de mensajes ni de archivos):
#   1. Buzon (interno/mensajes.json, repo publico): mensaje 'pendiente' nuevo  -> su destinatario
#        "Revisa el buzon (interno/mensajes.json): tienes el mensaje pendiente M-n."
#   2. Veredicto nuevo del Agente verificador en log\NN-veredicto*.json      -> Chat de desarrollo
#        "Hay veredicto nuevo del verificador: log\<archivo>. Revisalo."
#   3. Linea nueva en log\_resumen.txt de la cola (la CLI termino un lote)    -> Chat de desarrollo
#        "La CLI termino el lote NN (OK|FALLO): revisa la cola."
# El chat de cada destinatario sale de interno/destinatarios.json (lo mantiene el Arquitecto).
# Solo llama a la CLI (claude -p ... --cloud <sesion>) cuando hay un evento. La primera corrida de cada
# fuente marca lo existente como avisado, sin avisar.
#
# Carpeta: C:\Users\<usuario>\Downloads\str-instr-cola\buzon\
#   vigilar-buzon.ps1        este script
#   lanzar-buzon.vbs         lo corre sin ventana (tarea de Windows "STR buzon", cada 3 minutos)
#   notificados.txt          ids de mensajes ya avisados
#   veredictos-avisados.txt  nombres de veredictos ya avisados
#   cola-lineas.txt          lineas de _resumen.txt ya revisadas
#   buzon.log                una linea por aviso o error
# Borrar uno de los .txt reinicia esa fuente sin avisar.
#
# Manual: powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\Downloads\str-instr-cola\buzon\vigilar-buzon.ps1"

$ErrorActionPreference = 'Continue'
$Cola     = Join-Path $HOME 'Downloads\str-instr-cola'
$Base     = Join-Path $Cola 'buzon'
$EstMsg   = Join-Path $Base 'notificados.txt'
$EstVer   = Join-Path $Base 'veredictos-avisados.txt'
$EstCola  = Join-Path $Base 'cola-lineas.txt'
$LogFile  = Join-Path $Base 'buzon.log'
$Lock     = Join-Path $Base '.corriendo'
$Claude   = Join-Path $HOME '.local\bin\claude.exe'
$Resumen  = Join-Path $Cola 'log\_resumen.txt'
$LogDir   = Join-Path $Cola 'log'
$Raw      = 'https://raw.githubusercontent.com/thcure/str-manager-docs/main/interno'

New-Item -ItemType Directory -Force $Base | Out-Null
function Log([string]$t) { Add-Content -Path $LogFile -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $t) }

if ((Test-Path $Lock) -and (((Get-Date) - (Get-Item $Lock).LastWriteTime).TotalMinutes -lt 10)) { exit 0 }
Set-Content -Path $Lock -Value (Get-Date)

function Avisar([string]$destNombre, [string]$texto, $dest) {
    $d = $dest | Where-Object { $_.nombre -eq $destNombre } | Select-Object -First 1
    if (-not $d -or -not $d.sesion) { Log "Sin sesion registrada para '$destNombre'; no se avisa."; return $false }
    $sesion = [string]$d.sesion
    if ($sesion -notmatch '^(cse|session)_[A-Za-z0-9]+$') { Log "Sesion con formato invalido para '$destNombre'; no se avisa."; return $false }
    $salida = & $Claude -p $texto --cloud $sesion --output-format json 2>&1 | Out-String
    if ($salida -match '"ok"\s*:\s*true') { return $true }
    Log ("ERROR al avisar a ${destNombre}: " + ($salida -replace '\s+', ' ').Trim())
    return $false
}

try {
    $t = [DateTime]::UtcNow.Ticks
    try {
        $dest = (Invoke-RestMethod -Uri "$Raw/destinatarios.json?t=$t" -UseBasicParsing).destinatarios
    } catch { Log ('ERROR al leer destinatarios: ' + $_.Exception.Message); return }

    # --- 1. Buzon ---
    try {
        $msgs = (Invoke-RestMethod -Uri "$Raw/mensajes.json?t=$t" -UseBasicParsing).mensajes
        if (-not (Test-Path $EstMsg)) {
            $msgs | ForEach-Object { $_.id } | Set-Content -Path $EstMsg
            Log ("Inicio buzon: " + @($msgs).Count + " mensajes marcados sin avisar.")
        } else {
            $avisados = @(Get-Content -Path $EstMsg)
            foreach ($m in $msgs) {
                $id = [string]$m.id
                if ($id -notmatch '^M-\d+$' -or $m.estado -ne 'pendiente' -or $avisados -contains $id) { continue }
                $texto = "Revisa el buzon (interno/mensajes.json): tienes el mensaje pendiente $id."
                if (Avisar ([string]$m.para) $texto $dest) { Add-Content -Path $EstMsg -Value $id; Log "$id avisado a $($m.para)." }
            }
        }
    } catch { Log ('ERROR en buzon: ' + $_.Exception.Message) }

    # --- 2. Veredictos del verificador ---
    try {
        if (Test-Path $LogDir) {
            $ver = @(Get-ChildItem -Path $LogDir -Filter '*veredicto*.json' -File | Where-Object { $_.Name -match '^\d{1,3}-veredicto[A-Za-z0-9-]*\.json$' } | Sort-Object LastWriteTime)
            if (-not (Test-Path $EstVer)) {
                $ver | ForEach-Object { $_.Name } | Set-Content -Path $EstVer
                Log ("Inicio veredictos: " + $ver.Count + " marcados sin avisar.")
            } else {
                $hechos = @(Get-Content -Path $EstVer)
                foreach ($v in $ver) {
                    if ($hechos -contains $v.Name) { continue }
                    if (((Get-Date) - $v.LastWriteTime).TotalSeconds -lt 30) { continue }  # aun se esta escribiendo
                    $texto = "Hay veredicto nuevo del verificador: log\$($v.Name). Revisalo."
                    if (Avisar 'Chat de desarrollo' $texto $dest) { Add-Content -Path $EstVer -Value $v.Name; Log "$($v.Name) avisado a Chat de desarrollo." }
                }
            }
        }
    } catch { Log ('ERROR en veredictos: ' + $_.Exception.Message) }

    # --- 3. Cola de la CLI ---
    try {
        if (Test-Path $Resumen) {
            $lineas = @(Get-Content -Path $Resumen)
            if (-not (Test-Path $EstCola)) {
                Set-Content -Path $EstCola -Value $lineas.Count
                Log ("Inicio cola: " + $lineas.Count + " lineas marcadas sin avisar.")
            } else {
                $vistas = [int](Get-Content -Path $EstCola | Select-Object -First 1)
                if ($lineas.Count -lt $vistas) { $vistas = 0 }
                for ($i = $vistas; $i -lt $lineas.Count; $i++) {
                    $l = [string]$lineas[$i]
                    $estado = if ($l -match '\bFALLO\b') { 'FALLO' } elseif ($l -match '\bOK\b') { 'OK' } else { '' }
                    if (-not $estado) { Set-Content -Path $EstCola -Value ($i + 1); continue }
                    $num = if ($l -match '(\d{1,3})-instr') { $Matches[1] } elseif ($l -match '\|\s*(\d{1,3})\b') { $Matches[1] } else { '' }
                    $texto = if ($num) { "La CLI termino el lote $num ($estado): revisa la cola." } else { "La CLI termino un lote ($estado): revisa la cola." }
                    if (Avisar 'Chat de desarrollo' $texto $dest) { Set-Content -Path $EstCola -Value ($i + 1); Log "Cola: lote $num $estado avisado a Chat de desarrollo." }
                    else { break }
                }
            }
        }
    } catch { Log ('ERROR en cola: ' + $_.Exception.Message) }
} finally {
    Remove-Item -Path $Lock -Force -ErrorAction SilentlyContinue
}
