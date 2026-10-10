# vigilar-buzon.ps1 - Despertador de los chats (Arquitecto, 2026-10-10; v9: Carlos como destinatario, verificador y CLI sin avance)
#
# Revisa tres fuentes sin usar Claude y, por cada evento nuevo, deja en el chat destinatario SOLO una
# frase fija (nunca el contenido de mensajes ni de archivos):
#   1. Buzon (interno/mensajes.json, repo publico): mensaje 'pendiente' nuevo  -> su destinatario
#        "Revisa el buzon (interno/mensajes.json): tienes el mensaje pendiente M-n."
#   2. Veredicto nuevo del Agente verificador en log\NN-veredicto*.json      -> Chat de desarrollo
#        "Hay veredicto nuevo del verificador: log\<archivo>. Revisalo."
#   3. Linea nueva en log\_resumen.txt de la cola (la CLI termino un lote)    -> Chat de desarrollo
#        "La CLI termino el lote NN (OK|FALLO): revisa la cola."
#   4. Vigia de estancamiento (solo si 'Chat de diseno' esta en destinatarios.json): plan[] con trabajo
#      libre, nada en curso y sin movimiento desde hace $VigiaMin min, entre $VigiaDesde y $VigiaHasta h
#      -> Chat de diseno: "El plan tiene trabajo libre y no hay movimiento desde las HH:MM: retomalo."
#      Un aviso por episodio y como mucho uno cada $VigiaEntre min (ficha BAI11-d).
#   5. Cola detenida: un .md sigue en fallidas\ $FallaMin min o mas           -> Chat de desarrollo
#      (se repite cada $FallaCada min, tambien al Chat de diseno). Estado: fallidas-avisadas.txt
#   6. Verificador sin entregar: log\verificar.json con $VerifMin min o mas y sin su archivoVeredicto
#      -> Chat de desarrollo; si sigue, cada $VerifCada min tambien a Carlos. Estado: verificador-avisado.txt
#   7. CLI sin avance: .corriendo con $CliMin min o mas y el log del lote sin cambios -> Chat de desarrollo;
#      si sigue, cada $CliCada min tambien a Carlos. Estado: cli-avisado.txt
# v9: 'Carlos' es destinatario del buzon (destinatarios.json, canal 'windows'): a el no se le escribe en un chat,
#     se le muestra una notificacion de Windows en LENOVO (titulo y asunto del mensaje) y el Panel STR lista lo que
#     espera de el. Los mensajes para Carlos reciben recordatorio, pero no se escalan al Chat de diseno.
# El chat de cada destinatario sale de interno/destinatarios.json (lo mantiene el Arquitecto).
# v4: cada corrida pregunta a GitHub el ultimo commit de main (git ls-remote, ~2 KB); solo si cambio,
# descarga destinatarios, mensajes y seguimiento de ESE commit (raw/<sha>/..., sin cache vieja) a buzon\cache\.
# Las fuentes locales (veredictos, cola) se revisan siempre. Tarea de Windows: cada 1 minuto.
# Solo llama a la CLI (claude -p ... --cloud <sesion>) cuando hay un evento. La primera corrida de cada
# fuente marca lo existente como avisado, sin avisar.
#
# Carpeta: C:\Users\<usuario>\Downloads\str-instr-cola\buzon\
#   vigilar-buzon.ps1        este script
#   lanzar-buzon.vbs         lo corre sin ventana (tarea de Windows "STR buzon", cada 3 minutos)
#   notificados.txt          ids de mensajes ya avisados
#   veredictos-avisados.txt  nombres de veredictos ya avisados
#   cola-lineas.txt          lineas de _resumen.txt ya revisadas
#   vigia.txt                ultimo episodio avisado por el vigia (movimiento|hora del aviso)
#   avisados-hora.txt       id|hora en que se aviso cada mensaje (para el escalamiento)
#   recordados.txt / escalados.txt  mensajes ya recordados (30 min) o escalados al Chat de diseno (60 min)
#   sha.txt                  ultimo commit visto de str-manager-docs|hora en que se vio por primera vez
#   sinsesion.txt            mensajes ya anotados como 'sin sesion registrada' (para no repetir el log)
#   cache\                    copia de los JSON del ultimo commit visto
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
$RawBase  = 'https://raw.githubusercontent.com/thcure/str-manager-docs'
$RepoGit  = 'https://github.com/thcure/str-manager-docs.git'
$EstSha   = Join-Path $Base 'sha.txt'
$EstSinS  = Join-Path $Base 'sinsesion.txt'
$CacheDir = Join-Path $Base 'cache'
$EstHora  = Join-Path $Base 'avisados-hora.txt'
$EstRec   = Join-Path $Base 'recordados.txt'
$EstEsc   = Join-Path $Base 'escalados.txt'
$RecMin   = 30    # minutos 'pendiente' tras el aviso -> recordatorio al destinatario (una vez)
$EscMin   = 60    # minutos 'pendiente' tras el aviso -> aviso al Chat de diseno
$RecCada  = 60    # minutos minimos entre recordatorios al mismo chat
$EscCada  = 120   # minutos minimos entre escalamientos del mismo chat
$EstRecD  = Join-Path $Base 'recordados-dest.txt'
$EstFalla = Join-Path $Base 'fallidas-avisadas.txt'
$FallaMin  = 15    # minutos que un .md sigue en fallidas\ antes del primer aviso
$FallaCada = 60    # minutos entre avisos repetidos (con escalamiento al Chat de diseno)
$EstVerif  = Join-Path $Base 'verificador-avisado.txt'
$VerifMin  = 25    # minutos de verificar.json sin veredicto antes del primer aviso
$VerifCada = 60    # minutos entre avisos repetidos (el segundo y siguientes tambien a Carlos)
$EstCli    = Join-Path $Base 'cli-avisado.txt'
$CliMin    = 45    # minutos de .corriendo sin que el log del lote cambie
$CliCada   = 60    # minutos entre avisos repetidos (el segundo y siguientes tambien a Carlos)
$EstEscD  = Join-Path $Base 'escalados-dest.txt'
$EstVigia = Join-Path $Base 'vigia.txt'
$VigiaMin   = 60    # minutos sin movimiento
$VigiaEntre = 120   # minutos minimos entre avisos
$VigiaDesde = 7     # hora de inicio (incluida)
$VigiaHasta = 22    # hora de fin (excluida)

# Jornada en pausa (panel STR): con el archivo PAUSA en la cola no se avisa a nadie.
if (Test-Path (Join-Path $Cola 'PAUSA')) { exit 0 }
New-Item -ItemType Directory -Force $Base | Out-Null
function Log([string]$t) { Add-Content -Path $LogFile -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $t) }

if ((Test-Path $Lock) -and (((Get-Date) - (Get-Item $Lock).LastWriteTime).TotalMinutes -lt 10)) { exit 0 }
Set-Content -Path $Lock -Value (Get-Date)

function Notificar-Windows([string]$titulo, [string]$texto) {
    # Notificacion de Windows (centro de notificaciones) para Carlos; si falla, globo de la bandeja.
    try {
        $null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
        $null = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]
        $e1 = [System.Security.SecurityElement]::Escape($titulo); $e2 = [System.Security.SecurityElement]::Escape($texto)
        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml("<toast duration='long'><visual><binding template='ToastGeneric'><text>$e1</text><text>$e2</text></binding></visual></toast>")
        $appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show((New-Object Windows.UI.Notifications.ToastNotification $xml))
        return $true
    } catch { Log ('Aviso: notificacion de Windows fallo (' + $_.Exception.Message + '); se intenta globo.') }
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $ni = New-Object System.Windows.Forms.NotifyIcon
        $ni.Icon = [System.Drawing.SystemIcons]::Information; $ni.Visible = $true
        $ni.ShowBalloonTip(20000, $titulo, $texto, [System.Windows.Forms.ToolTipIcon]::Info)
        Start-Sleep -Seconds 6; $ni.Dispose()
        return $true
    } catch { Log ('ERROR al notificar a Carlos: ' + $_.Exception.Message); return $false }
}

function Avisar([string]$destNombre, [string]$texto, $dest) {
    $d = $dest | Where-Object { $_.nombre -eq $destNombre } | Select-Object -First 1
    if ($d -and ([string]$d.canal) -eq 'windows') { return (Notificar-Windows 'STR: te esperan' $texto) }
    if (-not $d -or -not $d.sesion) { Log "Sin sesion registrada para '$destNombre'; no se avisa."; return $false }
    $sesion = [string]$d.sesion
    if ($sesion -notmatch '^(cse|session)_[A-Za-z0-9]+$') { Log "Sesion con formato invalido para '$destNombre'; no se avisa."; return $false }
    $salida = & $Claude -p $texto --cloud $sesion --output-format json 2>&1 | Out-String
    if ($salida -match '"ok"\s*:\s*true') { return $true }
    Log ("ERROR al avisar a ${destNombre}: " + ($salida -replace '\s+', ' ').Trim())
    return $false
}

try {
    # --- 0. Ultimo commit de str-manager-docs (sin cache) y copia local de los JSON de ese commit ---
    New-Item -ItemType Directory -Force $CacheDir | Out-Null
    $previo = if (Test-Path $EstSha) { [string](Get-Content -Path $EstSha | Select-Object -First 1) } else { '' }
    $shaPrev = ($previo -split '\|')[0]
    $vistoEn = $null; if (($previo -split '\|').Count -gt 1) { try { $vistoEn = [DateTime]::Parse(($previo -split '\|')[1]) } catch { } }
    $sha = ''
    try {
        $lr = & git ls-remote $RepoGit refs/heads/main 2>$null | Select-Object -First 1
        if ($lr -match '^([0-9a-f]{40})\s') { $sha = $Matches[1] }
    } catch { }
    if (-not $sha) { Log 'Aviso: git ls-remote no respondio; se usa la copia local.' ; $sha = $shaPrev }
    $faltan = -not (Test-Path (Join-Path $CacheDir 'mensajes.json')) -or -not (Test-Path (Join-Path $CacheDir 'destinatarios.json')) -or -not (Test-Path (Join-Path $CacheDir 'seguimiento.json'))
    if ($sha -and ($sha -ne $shaPrev -or $faltan)) {
        try {
            foreach ($f in @('destinatarios.json', 'mensajes.json', 'seguimiento.json')) {
                Invoke-WebRequest -Uri "$RawBase/$sha/interno/$f" -UseBasicParsing -OutFile (Join-Path $CacheDir ($f + '.tmp'))
            }
            foreach ($f in @('destinatarios.json', 'mensajes.json', 'seguimiento.json')) {
                Move-Item -Force (Join-Path $CacheDir ($f + '.tmp')) (Join-Path $CacheDir $f)
            }
            if ($sha -ne $shaPrev) { $vistoEn = Get-Date }
            Set-Content -Path $EstSha -Value ($sha + '|' + ($(if ($vistoEn) { $vistoEn } else { Get-Date })).ToString('yyyy-MM-dd HH:mm:ss'))
        } catch { Log ('ERROR al descargar el commit ' + $sha + ': ' + $_.Exception.Message) }
    }
    function LeerCache([string]$f) { Get-Content -Path (Join-Path $CacheDir $f) -Raw -Encoding UTF8 | ConvertFrom-Json }
    try {
        $dest = (LeerCache 'destinatarios.json').destinatarios
    } catch { Log ('ERROR al leer destinatarios: ' + $_.Exception.Message); return }

    # --- 1. Buzon ---
    try {
        $msgs = (LeerCache 'mensajes.json').mensajes
        if (-not (Test-Path $EstMsg)) {
            $msgs | ForEach-Object { $_.id } | Set-Content -Path $EstMsg
            Log ("Inicio buzon: " + @($msgs).Count + " mensajes marcados sin avisar.")
        } else {
            $avisados = @(Get-Content -Path $EstMsg)
            foreach ($m in $msgs) {
                $id = [string]$m.id
                if ($id -notmatch '^M-\d+$' -or $m.estado -ne 'pendiente' -or $avisados -contains $id) { continue }
                $para = [string]$m.para
                if (-not ($dest | Where-Object { $_.nombre -eq $para })) {
                    $yaS = if (Test-Path $EstSinS) { @(Get-Content -Path $EstSinS) } else { @() }
                    if ($yaS -notcontains $id) { Add-Content -Path $EstSinS -Value $id; Log "Sin sesion registrada para el destinatario de $id; espera a que se registre." }
                    continue
                }
                $texto = "Revisa el buzon (interno/mensajes.json): tienes el mensaje pendiente $id."
                $dPara = $dest | Where-Object { $_.nombre -eq $para } | Select-Object -First 1
                if (([string]$dPara.canal) -eq 'windows') { $texto = "$id de $($m.de): $($m.asunto). Detalle en el Panel STR o en interno/mensajes.json." }
                if (Avisar ([string]$m.para) $texto $dest) { Add-Content -Path $EstMsg -Value $id; Add-Content -Path $EstHora -Value ($id + '|' + (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')); Log "$id avisado a $($m.para)." }
            }
        }
    } catch { Log ('ERROR en buzon: ' + $_.Exception.Message) }

    # --- 1b. Escalamiento agrupado por destinatario (v7, 10-oct-2026) ---
    # Por chat destinatario: si tiene mensajes avisados que siguen 'pendiente' mas de $RecMin min, UN recordatorio
    # con la lista (como mucho cada $RecCada min); si siguen mas de $EscMin min, UN aviso al Chat de diseno con la
    # lista (como mucho cada $EscCada min). Asi una sola causa no genera un aviso por mensaje.
    try {
        $ahoraE = Get-Date
        if ((Test-Path $EstHora) -and $ahoraE.Hour -ge $VigiaDesde -and $ahoraE.Hour -lt $VigiaHasta) {
            $horas = @{}
            foreach ($l in @(Get-Content -Path $EstHora)) { $p2 = ([string]$l) -split '\|'; if ($p2.Count -gt 1) { try { $horas[$p2[0]] = [DateTime]::Parse($p2[1]) } catch { } } }
            function Leer-Marcas($ruta) { $h = @{}; if (Test-Path $ruta) { foreach ($l in @(Get-Content -Path $ruta)) { $q = ([string]$l) -split '\|'; if ($q.Count -gt 1) { try { $h[$q[0]] = [DateTime]::Parse($q[1]) } catch { } } } }; return $h }
            $recD = Leer-Marcas $EstRecD
            $escD = Leer-Marcas $EstEscD
            $dis = $dest | Where-Object { ([string]$_.nombre) -match '^Chat de dise.o$' } | Select-Object -First 1
            $porDest = @{}
            foreach ($m in $msgs) {
                $id = [string]$m.id
                if ($m.estado -ne 'pendiente' -or -not $horas.ContainsKey($id)) { continue }
                $min = ($ahoraE - $horas[$id]).TotalMinutes
                if ($min -lt $RecMin) { continue }
                $para = [string]$m.para
                if (-not $porDest.ContainsKey($para)) { $porDest[$para] = @{ rec = @(); esc = @() } }
                $porDest[$para].rec += $id
                if ($min -ge $EscMin) { $porDest[$para].esc += $id }
            }
            foreach ($para in $porDest.Keys) {
                $g = $porDest[$para]
                if ($g.rec.Count -gt 0 -and (-not $recD.ContainsKey($para) -or ($ahoraE - $recD[$para]).TotalMinutes -ge $RecCada)) {
                    $t1 = "Recordatorio: tienes " + $g.rec.Count + " mensaje(s) pendiente(s) en el buzon (" + ($g.rec -join ', ') + "). Atiendelos o responde por que esperan."
                    if (Avisar $para $t1 $dest) { $recD[$para] = $ahoraE; Log ("Recordatorio a $para de " + ($g.rec -join ',') + ".") }
                }
                if ($g.esc.Count -gt 0 -and $dis -and $para -notmatch '^Chat de dise.o$' -and $para -ne 'Carlos' -and (-not $escD.ContainsKey($para) -or ($ahoraE - $escD[$para]).TotalMinutes -ge $EscCada)) {
                    $t2 = "Escalamiento: " + $para + " tiene " + $g.esc.Count + " mensaje(s) sin atender hace mas de $EscMin minutos (" + ($g.esc -join ', ') + "). Revisalo como jefe de proyecto; si la causa es una sola, tratala una vez."
                    if (Avisar ([string]$dis.nombre) $t2 $dest) { $escD[$para] = $ahoraE; Log ("Escalamiento de $para al Chat de diseno: " + ($g.esc -join ',') + ".") }
                }
            }
            Set-Content -Path $EstRecD -Value @($recD.Keys | ForEach-Object { $_ + '|' + $recD[$_].ToString('yyyy-MM-dd HH:mm:ss') })
            Set-Content -Path $EstEscD -Value @($escD.Keys | ForEach-Object { $_ + '|' + $escD[$_].ToString('yyyy-MM-dd HH:mm:ss') })
        }
    } catch { Log ('ERROR en escalamiento: ' + $_.Exception.Message) }

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

    # --- 4. Vigia de estancamiento ---
    try {
        $dv = $dest | Where-Object { ([string]$_.nombre) -match '^Chat de dise.o$' } | Select-Object -First 1
        $ahora = Get-Date
        if ($dv -and $ahora.Hour -ge $VigiaDesde -and $ahora.Hour -lt $VigiaHasta) {
            $seg = LeerCache 'seguimiento.json'
            $libres = @($seg.plan | Where-Object {
                ($_.estado -eq 'previsto' -or $_.estado -eq 'siguiente') -and -not $_.espera -and
                ([string]$_.esperaA) -ne 'Carlos' -and
                ([string]$_.categoria) -notmatch '^cr.tico$' -and ([string]$_.categoriaPrevista) -notmatch '^cr.tico$' })
            $enCurso = (Test-Path (Join-Path $Cola '.corriendo')) -or (@(Get-ChildItem -Path $Cola -Filter '*-instr-*.md' -File -ErrorAction SilentlyContinue).Count -gt 0)
            $marcas = @()
            $vj = Join-Path $LogDir 'verificar.json'
            if (Test-Path $vj) {
                $marcas += (Get-Item $vj).LastWriteTime
                try {
                    $vf = [string](Get-Content -Path $vj -Raw | ConvertFrom-Json).archivoVeredicto
                    if ($vf -and $vf -match '^[A-Za-z0-9._-]+\.json$' -and -not (Test-Path (Join-Path $LogDir $vf))) { $enCurso = $true }
                } catch { }
            }
            if ($libres.Count -gt 0 -and -not $enCurso) {
                if (Test-Path $Resumen) { $marcas += (Get-Item $Resumen).LastWriteTime }
                $uv = Get-ChildItem -Path $LogDir -Filter '*veredicto*.json' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1
                if ($uv) { $marcas += $uv.LastWriteTime }
                if ($vistoEn) { $marcas += $vistoEn }   # hora en que se vio el ultimo commit (sha.txt)
                $mov = ($marcas | Sort-Object | Select-Object -Last 1)
                if ($mov -and (($ahora - $mov).TotalMinutes -ge $VigiaMin)) {
                    $clave = $mov.ToString('yyyy-MM-dd HH:mm')
                    $previo = if (Test-Path $EstVigia) { [string](Get-Content -Path $EstVigia | Select-Object -First 1) } else { '' }
                    $pClave = ($previo -split '\|')[0]
                    $pHora = $null; if (($previo -split '\|').Count -gt 1) { try { $pHora = [DateTime]::Parse(($previo -split '\|')[1]) } catch { } }
                    $espaciado = (-not $pHora) -or (($ahora - $pHora).TotalMinutes -ge $VigiaEntre)
                    if ($pClave -ne $clave -and $espaciado) {
                        $texto = "El plan tiene trabajo libre y no hay movimiento desde las " + $mov.ToString('HH:mm') + ": retomalo."
                        if (Avisar ([string]$dv.nombre) $texto $dest) {
                            Set-Content -Path $EstVigia -Value ($clave + '|' + $ahora.ToString('yyyy-MM-dd HH:mm:ss'))
                            Log ("Vigia: aviso a Chat de diseno (" + $libres.Count + " items libres; sin movimiento desde $clave).")
                        }
                    }
                }
            }
        }
    } catch { Log ('ERROR en vigia: ' + $_.Exception.Message) }

    # --- 5. Cola detenida por un lote en fallidas\ (v8, 10-oct-2026) ---
    # Mientras haya un .md en fallidas\, ejecutar-cola.ps1 no corre ningun lote. Cuando el despertador lo ve
    # ahi $FallaMin min seguidos, avisa al Chat de desarrollo; si sigue, repite cada $FallaCada min al
    # Chat de desarrollo y al Chat de diseno. Estado: fallidas-avisadas.txt (clave|visto desde|ultimo aviso).
    try {
        $ahoraF = Get-Date
        $fall = @(Get-ChildItem -Path (Join-Path $Cola 'fallidas') -Filter '*.md' -File -ErrorAction SilentlyContinue)
        $prev = @{}
        if (Test-Path $EstFalla) { foreach ($l in @(Get-Content -Path $EstFalla)) { $q = ([string]$l) -split '\|'; if ($q.Count -ge 3) { $prev[$q[0]] = @($q[1], $q[2]) } } }
        $lineasF = @()
        foreach ($f in $fall) {
            $clave = $f.Name + '@' + $f.LastWriteTime.ToString('yyyyMMddHHmmss')
            $desde = $ahoraF; $ult = $null
            if ($prev.ContainsKey($clave)) {
                try { $desde = [DateTime]::Parse($prev[$clave][0]) } catch { }
                if ($prev[$clave][1]) { try { $ult = [DateTime]::Parse($prev[$clave][1]) } catch { } }
            }
            $toca = (($ahoraF - $desde).TotalMinutes -ge $FallaMin) -and ((-not $ult) -or (($ahoraF - $ult).TotalMinutes -ge $FallaCada))
            if ($toca) {
                $num = if ($f.Name -match '^(\d{1,3})-') { $Matches[1] } else { $f.BaseName }
                $copia = Join-Path $Cola $f.Name
                $texto = if ((Test-Path $copia) -and ((Get-Item $copia).LastWriteTime -gt $f.LastWriteTime)) {
                    "La cola esta detenida: hay una copia nueva del lote $num en la cola, pero no corre mientras siga fallidas\$($f.Name). Pidele a Carlos que borre ese archivo."
                } else {
                    "La cola esta detenida: el lote $num esta en fallidas\ y no corre ningun lote mientras siga ahi. Revisa log\$($f.BaseName).txt y resuelvelo."
                }
                if (Avisar 'Chat de desarrollo' $texto $dest) {
                    Log "Cola detenida: lote $num en fallidas avisado a Chat de desarrollo."
                    if ($ult) {
                        $dv5 = $dest | Where-Object { ([string]$_.nombre) -match '^Chat de dise.o$' } | Select-Object -First 1
                        if ($dv5 -and (Avisar ([string]$dv5.nombre) ('Escalamiento: ' + $texto) $dest)) { Log "Cola detenida: lote $num escalado al Chat de diseno." }
                    }
                    $ult = $ahoraF
                }
            }
            $lineasF += ($clave + '|' + $desde.ToString('yyyy-MM-dd HH:mm:ss') + '|' + $(if ($ult) { $ult.ToString('yyyy-MM-dd HH:mm:ss') } else { '' }))
        }
        if ($lineasF.Count -gt 0) { Set-Content -Path $EstFalla -Value $lineasF }
        elseif (Test-Path $EstFalla) { Remove-Item -Path $EstFalla -Force -ErrorAction SilentlyContinue }
    } catch { Log ('ERROR en fallidas: ' + $_.Exception.Message) }

    # --- 6. Verificador sin entregar (v9, 10-oct-2026) ---
    # Si log\verificar.json lleva $VerifMin min o mas y no existe su archivoVeredicto (ni otro veredicto del lote
    # posterior), la tarea del verificador no corrio, murio o quedo esperando un permiso. Primer aviso al Chat de
    # desarrollo (relanza); si sigue, cada $VerifCada min se repite y Carlos recibe el paso exacto.
    try {
        $vj = Join-Path $LogDir 'verificar.json'
        if (Test-Path $vj) {
            $fv = Get-Item $vj; $ahoraV = Get-Date
            $edadV = ($ahoraV - $fv.LastWriteTime).TotalMinutes
            $v = Get-Content -Path $vj -Raw -Encoding UTF8 | ConvertFrom-Json
            $arch = [string]$v.archivoVeredicto; $loteV = [string]$v.lote
            $entregado = ($arch -and (Test-Path (Join-Path $Cola $arch)))
            if (-not $entregado -and $loteV) {
                $otro = @(Get-ChildItem -Path $LogDir -Filter ($loteV + '-veredicto*.json') -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt $fv.LastWriteTime })
                if ($otro.Count -gt 0) { $entregado = $true }
            }
            $claveV = 'verificar@' + $fv.LastWriteTime.ToString('yyyyMMddHHmmss')
            $prevV = if (Test-Path $EstVerif) { ([string](Get-Content -Path $EstVerif | Select-Object -First 1)) -split '\|' } else { @('') }
            $ultV = $null; if ($prevV[0] -eq $claveV -and $prevV.Count -gt 1 -and $prevV[1]) { try { $ultV = [DateTime]::Parse($prevV[1]) } catch { } }
            if ($entregado) { if (Test-Path $EstVerif) { Remove-Item -Path $EstVerif -Force -ErrorAction SilentlyContinue } }
            elseif ($edadV -ge $VerifMin -and ((-not $ultV) -or (($ahoraV - $ultV).TotalMinutes -ge $VerifCada))) {
                $desdeV = $fv.LastWriteTime.ToString('HH:mm')
                $t6 = "El verificador no ha entregado $arch y log\verificar.json espera desde las $desdeV (lote $loteV, " + [int]$edadV + " min). Revisa en LENOVO si la tarea del verificador corrio, murio o quedo esperando un permiso, y relanzala si hace falta."
                if (Avisar 'Chat de desarrollo' $t6 $dest) {
                    Log "Verificador sin entregar: lote $loteV avisado a Chat de desarrollo."
                    if ($ultV) { [void](Avisar 'Carlos' ("El verificador sigue sin entregar el veredicto del lote $loteV desde las $desdeV. Abre Cowork > Tareas programadas > Agente verificador y mira si espera una aprobacion o un clic.") $dest) }
                    Set-Content -Path $EstVerif -Value ($claveV + '|' + $ahoraV.ToString('yyyy-MM-dd HH:mm:ss'))
                }
            }
        }
    } catch { Log ('ERROR en verificador: ' + $_.Exception.Message) }

    # --- 7. CLI sin avance (v9, 10-oct-2026) ---
    # Si la cola tiene .corriendo desde hace $CliMin min o mas y el log del lote no cambia desde hace $CliMin min,
    # la CLI quedo esperando algo o murio (ejecutar-cola.ps1 limpia el candado a los 90 min). Primer aviso al Chat
    # de desarrollo; si sigue, cada $CliCada min se repite y Carlos recibe el paso exacto.
    try {
        $lockC = Join-Path $Cola '.corriendo'
        if (Test-Path $lockC) {
            $fl = Get-Item -Force $lockC; $ahoraC = Get-Date
            $edadC = ($ahoraC - $fl.LastWriteTime).TotalMinutes
            $ultLog = Get-ChildItem -Path $LogDir -Filter '*-instr-*.txt' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1
            $quieto = (-not $ultLog) -or (($ahoraC - $ultLog.LastWriteTime).TotalMinutes -ge $CliMin)
            $claveC = 'cli@' + $fl.LastWriteTime.ToString('yyyyMMddHHmmss')
            $prevC = if (Test-Path $EstCli) { ([string](Get-Content -Path $EstCli | Select-Object -First 1)) -split '\|' } else { @('') }
            $ultC = $null; if ($prevC[0] -eq $claveC -and $prevC.Count -gt 1 -and $prevC[1]) { try { $ultC = [DateTime]::Parse($prevC[1]) } catch { } }
            if ($edadC -ge $CliMin -and $quieto -and ((-not $ultC) -or (($ahoraC - $ultC).TotalMinutes -ge $CliCada))) {
                $numC = if ($ultLog -and $ultLog.Name -match '^(\d{1,3})-') { $Matches[1] } else { '?' }
                $desdeC = $fl.LastWriteTime.ToString('HH:mm')
                $t7 = "La CLI lleva " + [int]$edadC + " min con el lote $numC (desde las $desdeC) y su log no cambia. Revisa en LENOVO si claude.exe sigue corriendo o quedo esperando; si murio, se limpia solo a los 90 min."
                if (Avisar 'Chat de desarrollo' $t7 $dest) {
                    Log "CLI sin avance: lote $numC avisado a Chat de desarrollo."
                    if ($ultC) { [void](Avisar 'Carlos' ("La CLI sigue sin avanzar con el lote $numC desde las $desdeC. Mira en LENOVO si hay una ventana de claude.exe esperando algo.") $dest) }
                    Set-Content -Path $EstCli -Value ($claveC + '|' + $ahoraC.ToString('yyyy-MM-dd HH:mm:ss'))
                }
            }
        } elseif (Test-Path $EstCli) { Remove-Item -Path $EstCli -Force -ErrorAction SilentlyContinue }
    } catch { Log ('ERROR en cli: ' + $_.Exception.Message) }
} finally {
    Remove-Item -Path $Lock -Force -ErrorAction SilentlyContinue
}
