# ejecutar-cola.ps1 (v7.3, 13-oct-2026: la guardia de criticos acepta LM-n como DA-n) (v7.2, 13-oct-2026: modelo-cargas\ MIGRAR y paquetes por pw\modelo-llamar.js) (v7.1, 13-oct-2026: Probar-Y-Juzgar como funcion; carpeta reprobar\ repite pruebas y juez de un lote de hechas sin reconstruirlo) (v7, 12-oct-2026, LM-19: tras probar-lote verde o rojo, juez local sobre capturas -> log\L-n-veredicto.json; SIN-JUEZ lo apaga) (v6, 12-oct-2026, PRUEBAS-v1/LM-18: tras el commit corre pw\probar-lote.js = P4 puerta de entrada + P5 guion y regresion; escribe log\L-n-pruebas.json) (v5, 12-oct-2026, B3b: ids L-n; orden por numero de lote, acepta NN-instr-* y L-NN-instr-*) (v4: STR_INSTR/STR_LOTE; --settings auto-mode.json) (v3, LM-2) — Ejecuta en orden las instrucciones que Claude (Cowork) deja en la cola
# Carpeta de la cola: C:\Users\<usuario>\Downloads\str-instr-cola\   (fuera del repositorio)
#   *.md            → instrucciones pendientes (se ejecutan por numero de lote: 75-instr-*.md o L-75-instr-*.md; v5)
#   hechas\         → instrucciones ya ejecutadas (con commit)
#   fallidas\       → instrucciones que terminaron sin commit (la cola se detiene ahí)
#   log\<nombre>.txt → salida completa de la CLI por instrucción
#   log\_resumen.txt → una línea por instrucción: fecha | archivo | hash | estado
#   log\L-n-pruebas.json → P4/P5 de PRUEBAS-v1 (v6); con el archivo SIN-PRUEBAS en la cola no se corren
#   log\L-n-veredicto.json → juez local (v7, LM-19); log\capturas\L-n\ las capturas N3; con SIN-JUEZ no corre
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

# v7.1: pruebas (P4/P5) y juez (LM-19) de un lote ya en hechas\. Lo usan el final de cada lote y reprobar\.
function Probar-Y-Juzgar([string]$nombre, [string]$hash) {
  $baseN = [IO.Path]::GetFileNameWithoutExtension($nombre)
  # v6 (PRUEBAS-v1, LM-18): P4 + P5 sin Claude. Espera el despliegue (hasta 10 min), corre tests/, compara el guion
  # con la instruccion, comprueba semilla y sesiones, corre el guion N2 y la regresion de su zona.
  # Resultado en log\L-n-pruebas.json (verde | rojo | bloqueado). No escribe veredicto: juzga el verificador.
  $probar = Join-Path $Cola 'pw\probar-lote.js'
  $node = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -First 1).Source
  if ($node -and (Test-Path $probar) -and -not (Test-Path (Join-Path $Cola 'SIN-PRUEBAS'))) {
    $salidaP = Join-Path $Log ($baseN + '.pruebas.txt')
    Push-Location (Join-Path $Cola 'pw')
    (& $node $probar --instr (Join-Path $Hechas $nombre) --repo $Repo 2>&1 | ForEach-Object { "$_" }) | Out-File -FilePath $salidaP -Encoding UTF8
    $codP = $LASTEXITCODE
    Pop-Location
    $ultima = (Get-Content -Path $salidaP -Encoding UTF8 -ErrorAction SilentlyContinue | Where-Object { $_ -match '^Pruebas ' } | Select-Object -Last 1)
    Resumen "PRUEBAS | $($nombre) | codigo $codP | $ultima"
    Write-Host "PRUEBAS - $ultima"
    # v7 (LM-19): juez local. Claude sin navegador, sin red y sin comandos lee instruccion, pruebas.json y capturas
    # y escribe solo el veredicto. Sonnet; Opus si el lote es critico. Con SIN-JUEZ en la cola no corre.
    $loteId = $null; if ($nombre -match '^(?:L-)?(\d+)-') { $loteId = 'L-' + $Matches[1] }
    $pruebasJson = if ($loteId) { Join-Path $Log ($loteId + '-pruebas.json') } else { $null }
    $juez = Join-Path $Cola 'juez\texto-juez.md'
    if ($loteId -and (Test-Path $pruebasJson) -and (Test-Path $juez) -and -not (Test-Path (Join-Path $Cola 'SIN-JUEZ'))) {
      $pr = $null; try { $pr = Get-Content -Raw -Encoding UTF8 $pruebasJson | ConvertFrom-Json } catch { }
      if ($pr -and ($pr.resultado -eq 'verde' -or $pr.resultado -eq 'rojo')) {
        $n = 1; $arch = $loteId + '-veredicto.json'
        while (Test-Path (Join-Path $Log $arch)) { $n++; $arch = $loteId + '-veredicto-' + $n + '.json' }
        $cabH = (Get-Content -Path (Join-Path $Hechas $nombre) -TotalCount 15 -Encoding UTF8 | Out-String)
        $modelo = 'sonnet'; if ($cabH -match '(?i)categor[i\u00ed]a[^\r\n]*cr[i\u00ed]tico') { $modelo = 'opus' }
        $t = Get-Content -Raw -Encoding UTF8 $juez
        $t = $t.Replace('{LOTE}', $loteId).Replace('{INSTR}', ('hechas\' + $nombre)).Replace('{PRUEBAS}', ('log\' + $loteId + '-pruebas.json')).Replace('{CAPTURAS}', ('log\capturas\' + $loteId)).Replace('{ARCHIVO}', ('log\' + $arch)).Replace('{HASH}', $hash.Substring(0,7))
        $pj = Join-Path $Log ($loteId + '-juez.md')
        [IO.File]::WriteAllText($pj, $t, (New-Object System.Text.UTF8Encoding $false))
        $salidaJ = Join-Path $Log ($loteId + '-juez.txt')
        $promptJ = 'Lee el archivo log\' + $loteId + '-juez.md y sigue esas instrucciones.'
        Push-Location $Cola
        (& $Claude -p $promptJ --model $modelo --permission-mode default --strict-mcp-config --allowedTools 'Read' 'Glob' 'Grep' ('Edit(./log/' + $arch + ')') --disallowedTools 'Bash' 'WebFetch' 'WebSearch' 'NotebookEdit' --output-format text 2>&1 | ForEach-Object { "$_" }) | Out-File -FilePath $salidaJ -Encoding UTF8
        Pop-Location
        if (Test-Path (Join-Path $Log $arch)) { Resumen "JUEZ | $($nombre) | $modelo | $arch" } else { Resumen "JUEZ | $($nombre) | $modelo | sin veredicto: ver log\$loteId-juez.txt" }
      }
    }
  }
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

  # v7.1: reprobar\<archivo de hechas sin .md>.txt -> repite pruebas y juez de ese lote sin reconstruirlo
  # (p. ej. tras arreglar la herramienta de pruebas). El .txt pasa a reprobar\hechos\ con la hora.
  $Reprobar = Join-Path $Cola 'reprobar'
  foreach ($rp in @(Get-ChildItem -Path $Reprobar -Filter '*.txt' -File -ErrorAction SilentlyContinue)) {
    $nomR = $rp.BaseName + '.md'
    if (Test-Path (Join-Path $Hechas $nomR)) {
      $hR = (git rev-parse HEAD 2>$null | Select-Object -First 1).Trim()
      Resumen "REPROBAR | $nomR | pedido con reprobar\$($rp.Name)"
      Probar-Y-Juzgar $nomR $hR
    } else { Resumen "REPROBAR | $nomR | no esta en hechas; se ignora" }
    $destR = Join-Path $Reprobar 'hechos'; if (-not (Test-Path $destR)) { New-Item -ItemType Directory -Path $destR | Out-Null }
    Move-Item -Path $rp.FullName -Destination (Join-Path $destR ($rp.BaseName + '.' + (Get-Date -Format 'yyyyMMdd-HHmm') + '.txt')) -Force
  }

  # v7.2 (B7, LM-16/LM-20): modelo-cargas\MIGRAR o modelo-cargas\paquete-*.json -> pw\modelo-llamar.js (token de
  # claves\modelo-arq.txt, nunca en el log). Solo datos: la cola no ejecuta nada del paquete. Pasa a modelo-cargas\hechas\.
  $Cargas = Join-Path $Cola 'modelo-cargas'
  $llamar = Join-Path $Cola 'pw\modelo-llamar.js'
  $nodeM = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -First 1).Source
  if ($nodeM -and (Test-Path $llamar)) {
    foreach ($mc in @(Get-ChildItem -Path $Cargas -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'MIGRAR' -or $_.Name -match '^paquete-[A-Za-z0-9-]+\.json$' })) {
      Push-Location (Join-Path $Cola 'pw')
      if ($mc.Name -eq 'MIGRAR') { $resM = (& $nodeM $llamar 'migrar' 2>&1 | ForEach-Object { "$_" }) } else { $resM = (& $nodeM $llamar 'cargar' $mc.FullName 2>&1 | ForEach-Object { "$_" }) }
      Pop-Location
      Resumen ("MODELO | " + $mc.Name + " | " + (($resM | Select-Object -Last 1) -replace '[^\x20-\x7E]', ''))
      $destM = Join-Path $Cargas 'hechas'; if (-not (Test-Path $destM)) { New-Item -ItemType Directory -Path $destM | Out-Null }
      Move-Item -Path $mc.FullName -Destination (Join-Path $destM ((Get-Date -Format 'yyyyMMdd-HHmm') + '-' + $mc.Name)) -Force
    }
  }

  # v5 (B3b): orden por numero de lote, no por nombre; acepta 75-instr-*.md y L-75-instr-*.md (id L-n del modelo)
  $pendientes = Get-ChildItem -Path $Cola -Filter '*.md' -File | Where-Object { $_.Name -notmatch '\.sin-cruce\.md$' } |
    Sort-Object @{ Expression = { if ($_.Name -match '^(?:L-)?(\d+)-') { [int]$Matches[1] } else { 999999 } } }, Name
  if (-not $pendientes) { exit 0 }

  # v3: la CLI acepta --permission-prompts none desde la 2.1.259; si esta version no lo conoce, no se pasa
  $flagsExtra = @()
  try { $ayuda = (& $Claude --help 2>&1 | Out-String); if ($ayuda -match 'permission-prompts') { $flagsExtra = @('--permission-prompts','none') } } catch { }

  foreach ($f in $pendientes) {
    if (Test-Path (Join-Path $Cola 'PAUSA')) { break }   # se pidio terminar la jornada: no empezar otro lote
    # v3: guardia de criticos. La cabecera (primeras 15 lineas) debe citar DA-n o el cruce previo con Carlos.
    $cab = (Get-Content -Path $f.FullName -TotalCount 15 -Encoding UTF8 | Out-String)
    if ($cab -match '(?i)categor[i\u00ed]a[^\r\n]*cr[i\u00ed]tico') {
      $conDA = $cab -match '(DA|LM)-\d+'   # v7.3: un lote del modelo cita LM-n en lugar de DA-n
      $conCruce = $cab -match '(?i)cruce[^\r\n]*carlos'
      if (-not ($conDA -or $conCruce)) {
        $nuevo = Join-Path $Cola ($f.BaseName + '.sin-cruce.md')
        Move-Item -Path $f.FullName -Destination $nuevo -Force
        Resumen "RECHAZADO | $($f.Name) | critico sin DA-n ni cruce con Carlos en la cabecera | renombrado a .sin-cruce.md"
        Write-Host "RECHAZADO · critico sin cruce · $($f.Name)"
        continue
      }
      if (-not $conDA) { Resumen "AVISO | $($f.Name) | critico con cruce pero sin DA-n ni LM-n (desde el 20-oct sera obligatoria)" }
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
      Probar-Y-Juzgar $f.Name $despues
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
