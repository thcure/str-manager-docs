# ejecutar-cola.ps1 (v4, 11-oct-2026: STR_INSTR/STR_LOTE para los hooks; --settings auto-mode.json) (v3, LM-2) — Ejecuta en orden las instrucciones que Claude (Cowork) deja en la cola
# Carpeta de la cola: C:\Users\<usuario>\Downloads\str-instr-cola\   (fuera del repositorio)
#   *.md            → instrucciones pendientes (se ejecutan por nombre: 01-..., 02-...)
#   hechas\         → instrucciones ya ejecutadas (con commit)
#   fallidas\       → instrucciones que terminaron sin commit (la cola se detiene ahí)
#   log\<nombre>.txt → salida completa de la CLI por instrucción
#   log\_resumen.txt → una línea por instrucción: fecha | archivo | hash | estado
#
# Uso manual (en una ventana de PowerShell normal, NO dentro de la CLI de Claude Code):
#   powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\Downloads\str-instr-cola\ejecutar-cola.ps1"
# Programado:  schtasks /Create /SC MINUTE /MO 15 /TN "STR cola CLI" /TR "powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\ktcol\Downloads\str-instr-cola\ejecutar-cola.ps1"
#
# Reglas: un lote crítico solo arranca si su cabecera cita una DA-n o el cruce previo con Carlos (v3, LM-2, 11-oct-2026);
# si no, se renombra a .sin-cruce.md, se anota RECHAZADO y se sigue con el siguiente.
# Si un lote termina sin commit nuevo, se mueve a fallidas\ y la cola se DETIENE (no arrastra al siguiente).
# Al volver a encolar un lote con el mismo nombre, su copia de fallidas\ pasa sola a fallidas\archivo\ (v3).
# Con el archivo PAUSA en la cola no se empieza ningun lote (panel STR).

# 'Continue': git y claude escriben su progreso normal por stderr; con 'Stop' PowerShell 5.1 lo
# trataría como error fatal (NativeCommandError). El éxito/fallo se decide comparando HEAD antes/después.
$ErrorActionPreference = 'Continue'
$Repo   = Join-Path $HOME 'str-manager'
$Claude = Join-Path $HOME '.local\bin\claude.exe'
$Cola   = Join-Path $HOME 'Downloads\str-instr-cola'
$Hechas = Join-Path $Cola 'hechas'
$Fallas = Join-Path $Cola 'fallidas'
$Log    = Join-Path $Cola 'log'
$Lock   = Join-Path $Cola '.corriendo'

foreach ($d in @($Cola, $Hechas, $Fallas, $Log)) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null } }

function Resumen($linea) {
  $ts = Get-Date -Format 'yyyy-MM-dd HH:mm'
  Add-Content -Path (Join-Path $Log '_resumen.txt') -Value "$ts | $linea" -Encoding UTF8
}

# Un solo proceso a la vez (si el candado tiene más de 90 min, se considera colgado y se limpia)
if (Test-Path $Lock) {
  $edad = (Get-Date) - (Get-Item $Lock).LastWriteTime
  if ($edad.TotalMinutes -lt 90) { exit 0 }
  Remove-Item $Lock -Force
}
New-Item -ItemType File -Path $Lock -Force | Out-Null

try {
  if (-not (Test-Path $Claude)) { Resumen "ERROR | claude.exe no encontrado en $Claude"; Write-Host 'claude.exe no encontrado'; exit 1 }
  if (-not (Test-Path (Join-Path $Repo 'CLAUDE.md'))) { Resumen "ERROR | no hay CLAUDE.md en $Repo"; Write-Host 'CLAUDE.md no encontrado'; exit 1 }
  if ($env:CLAUDECODE -or $env:CLAUDE_CODE) { Write-Host 'Este script se lanza desde PowerShell, no desde dentro de la CLI de Claude Code.'; Resumen 'ERROR | lanzado dentro de la CLI; no se ejecutó'; exit 1 }
  Set-Location $Repo

  # v3: una copia corregida en la raiz archiva sola la copia vieja de fallidas\ (mismo nombre)
  $Archivo = Join-Path $Fallas 'archivo'
  foreach ($fx in (Get-ChildItem -Path $Fallas -Filter '*.md' -File -ErrorAction SilentlyContinue)) {
    if (Test-Path (Join-Path $Cola $fx.Name)) {
      if (-not (Test-Path $Archivo)) { New-Item -ItemType Directory -Path $Archivo | Out-Null }
      $dest = Join-Path $Archivo ($fx.BaseName + '.' + (Get-Date -Format 'yyyyMMdd-HHmm') + '.md')
      Move-Item -Path $fx.FullName -Destination $dest -Force
      Resumen "ARCHIVADA | $($fx.Name) | copia de fallidas movida a fallidas\archivo por reencolado"
    }
  }

  # Si hay una instrucción fallida sin resolver, no seguir: Claude (Cowork) debe revisarla primero.
  if ((Get-ChildItem -Path $Fallas -Filter '*.md' -File -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0) {
    exit 0
  }

  # Jornada en pausa (panel STR, 10-oct-2026): con el archivo PAUSA en la cola no se empieza ningun lote.
  if (Test-Path (Join-Path $Cola 'PAUSA')) { exit 0 }

  $pendientes = Get-ChildItem -Path $Cola -Filter '*.md' -File | Where-Object { $_.Name -notmatch '\.sin-cruce\.md$' } | Sort-Object Name
  if (-not $pendientes) { exit 0 }

  # v3: la CLI acepta --permission-prompts none desde la 2.1.259; si esta version no lo conoce, no se pasa
  $flagsExtra = @()
  try { $ayuda = (& $Claude --help 2>&1 | Out-String); if ($ayuda -match 'permission-prompts') { $flagsExtra = @('--permission-prompts','none') } } catch { }

  foreach ($f in $pendientes) {
    if (Test-Path (Join-Path $Cola 'PAUSA')) { break }   # se pidio terminar la jornada: no empezar otro lote
    # v3: guardia de criticos. La cabecera (primeras 15 lineas) debe citar DA-n o el cruce previo con Carlos.
    $cab = (Get-Content -Path $f.FullName -TotalCount 15 -Encoding UTF8 | Out-String)
    if ($cab -match '(?i)categor[i\u00ed]a[^\r\n]*cr[i\u00ed]tico') {
      $conDA = $cab -match 'DA-\d+'
      $conCruce = $cab -match '(?i)cruce[^\r\n]*carlos'
      if (-not ($conDA -or $conCruce)) {
        $nuevo = Join-Path $Cola ($f.BaseName + '.sin-cruce.md')
        Move-Item -Path $f.FullName -Destination $nuevo -Force
        Resumen "RECHAZADO | $($f.Name) | critico sin DA-n ni cruce con Carlos en la cabecera | renombrado a .sin-cruce.md"
        Write-Host "RECHAZADO · critico sin cruce · $($f.Name)"
        continue
      }
      if (-not $conDA) { Resumen "AVISO | $($f.Name) | critico con cruce pero sin DA-n (desde el 20-oct sera obligatoria)" }
    }
    # Repositorio al día antes de cada lote
    Write-Host "Lote: $($f.Name)"
    (git pull --ff-only 2>&1 | ForEach-Object { "$_" }) | Out-Null
    $antes = (git rev-parse HEAD 2>$null | Select-Object -First 1).Trim()

    $prompt  = "Lee el archivo $($f.FullName) y ejecuta esa instrucción completa."
    $salida  = Join-Path $Log ($f.BaseName + '.txt')
    "=== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') · $($f.Name) · HEAD antes: $antes ===" | Out-File -FilePath $salida -Encoding UTF8

    # Modo de permisos: el mismo "auto" de la CLI interactiva. Si tu versión de la CLI
    # no acepta "auto", cambia la línea por:  --permission-mode bypassPermissions
    # v4 (A7): la instruccion del lote viaja a los hooks de la CLI por variables de entorno;
    # auto-mode.json (si existe) declara la infraestructura de confianza del modo automatico.
    $env:STR_INSTR = $f.FullName
    $env:STR_LOTE  = $f.BaseName
    $flagsLote = @() + $flagsExtra
    $autoCfg = Join-Path $Cola 'auto-mode.json'
    if (Test-Path $autoCfg) { $flagsLote += @('--settings', $autoCfg) }
    & $Claude -p $prompt --permission-mode auto --output-format text @flagsLote 2>&1 | Out-File -FilePath $salida -Append -Encoding UTF8
    $codigo = $LASTEXITCODE

    $despues = (git rev-parse HEAD 2>$null | Select-Object -First 1).Trim()
    "=== fin $(Get-Date -Format 'HH:mm:ss') · código $codigo · HEAD después: $despues ===" | Out-File -FilePath $salida -Append -Encoding UTF8

    if ($despues -ne $antes) {
      # Asegurar que el commit llegó a GitHub (la CLI hace push; por si no)
      # git escribe su progreso por stderr; convertir a texto evita el registro NativeCommandError en el log
      (git push 2>&1 | ForEach-Object { "$_" }) | Out-File -FilePath $salida -Append -Encoding UTF8
      Move-Item -Path $f.FullName -Destination (Join-Path $Hechas $f.Name) -Force
      Resumen "OK | $($f.Name) | $($despues.Substring(0,7)) | commit y push"
      Write-Host "OK · $($despues.Substring(0,7))"
    } else {
      Move-Item -Path $f.FullName -Destination (Join-Path $Fallas $f.Name) -Force
      Resumen "FALLO | $($f.Name) | sin commit (código $codigo) | cola detenida"
      Write-Host "FALLO · sin commit · ver $salida"
      break
    }
  }
}
finally {
  if (Test-Path $Lock) { Remove-Item $Lock -Force }
}
