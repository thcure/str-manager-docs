# vigilar-buzon.ps1 - Despertador de los chats (Arquitecto, 2026-10-12; v11.4 M-1095/INC: la seccion 7 ignora el candado .corriendo efimero o con fecha 1601 (falso "CLI sin avance"); v11.3 LM-57: escalamientos y vigia al Chat Jefe de proyecto si existe (si no, al Chat Diseno), por nombre normalizado; planes desde interno/proyecto.json si existe; v11.2 LM-19: avisos de pruebas bloqueadas, guion en rojo y juez sin veredicto; v11.1 B3b: nombres L-NN-* ademas de NN-*; v11 LM-12: plazos desde proceso.json y metricas en estado-vivo)
#
# v11 (LM-12, B9a): los plazos (verificador, CLI, fallidas, recordatorio, escalamiento) se leen de interno/proceso.json
#     (supervisor.plazosHoy y lote.estados[].plazoMin) cuando su estado es 'vigente'; si no se puede leer, valen las
#     constantes de abajo. estado-vivo.json suma 'plazos' (origen y valores en vigor) y 'metricas' (construido->aceptado
#     de los ultimos 7 dias por _resumen.txt y veredictos, lotes con mas de un veredicto, bloqueados hoy, espera de Carlos).
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
# v10 (LM-2): 1c) cuando un mensaje enviado por un chat pasa a 'hecho' con respuesta, se avisa al remitente;
#     el estado 'superado' lo pone el remitente y no genera avisos; el vigia calla si ningun plan esta activo
#     (diseno.json); la fuente 6 avisa si se lanzo el verificador sin pre-vuelo.json valido; cada corrida
#     escribe buzon\estado-vivo.json (lo lee el Panel). Lineas RECHAZADO de la cola -> Chat de desarrollo.
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
$VerifMin  = 15    # minutos de verificar.json sin veredicto antes del primer aviso (v10.3: 15, alineado con LM-1 s3.4)
$VerifCada = 60    # minutos entre avisos repetidos (el segundo y siguientes tambien a Carlos)
$EstCli    = Join-Path $Base 'cli-avisado.txt'
$EstResp   = Join-Path $Base 'respondidos.txt'     # v10: ids de mensajes cuya respuesta ya se aviso al remitente
$EstPreV   = Join-Path $Base 'prevuelo-avisado.txt' # v10: verificar.json (por fecha) ya avisado por falta de pre-vuelo
$EstadoVivo = Join-Path $Base 'estado-vivo.json'
$PreVueloMin = 10   # minutos de validez de pre-vuelo.json
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

function Nom([string]$n) {
    # v10: nombres equivalentes de un rol: 'Chat de diseno' = 'Chat Diseno' = 'Diseno'; sin acentos ni mayusculas (archivo ASCII: acentos como \uXXXX)
    $t = $n.ToLowerInvariant()
    $t = $t -replace '[\u00e1\u00e0\u00e4]', 'a' -replace '[\u00e9\u00e8\u00eb]', 'e' -replace '[\u00ed\u00ec\u00ef]', 'i' -replace '[\u00f3\u00f2\u00f6]', 'o' -replace '[\u00fa\u00f9\u00fc]', 'u' -replace '\u00f1', 'n'
    $t = ($t -replace '\bchat\b', '' -replace '\bde\b', '' -replace '\s+', ' ').Trim()
    return $t
}
function BuscarDest($dest, [string]$nombre) { $k = Nom $nombre; return ($dest | Where-Object { (Nom ([string]$_.nombre)) -eq $k } | Select-Object -First 1) }

# v11.3 (LM-57): quien recibe escalamientos y el vigia: el Chat Jefe de proyecto si esta en destinatarios.json; si no,
# el Chat Diseno. Por nombre normalizado (Nom): antes era una regex '^Chat de dise.o$' que no casaba con 'Chat Disen~o'
# (nombre desde LM-5), asi que el vigia y los escalamientos no le llegaban a nadie.
function JefeProyecto($dest) { $j = BuscarDest $dest 'Jefe de proyecto'; if ($j) { return $j }; return (BuscarDest $dest 'Diseno') }

function Avisar([string]$destNombre, [string]$texto, $dest) {
    $d = BuscarDest $dest $destNombre
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
    $faltan = -not (Test-Path (Join-Path $CacheDir 'mensajes.json')) -or -not (Test-Path (Join-Path $CacheDir 'destinatarios.json')) -or -not (Test-Path (Join-Path $CacheDir 'seguimiento.json')) -or -not (Test-Path (Join-Path $CacheDir 'diseno.json')) -or -not (Test-Path (Join-Path $CacheDir 'proceso.json'))
    if ($sha -and ($sha -ne $shaPrev -or $faltan)) {
        try {
            foreach ($f in @('destinatarios.json', 'mensajes.json', 'seguimiento.json', 'diseno.json', 'proceso.json')) {
                Invoke-WebRequest -Uri "$RawBase/$sha/interno/$f" -UseBasicParsing -OutFile (Join-Path $CacheDir ($f + '.tmp'))
            }
            foreach ($f in @('destinatarios.json', 'mensajes.json', 'seguimiento.json', 'diseno.json', 'proceso.json')) {
                Move-Item -Force (Join-Path $CacheDir ($f + '.tmp')) (Join-Path $CacheDir $f)
            }
            # v11.3 (LM-57): proyecto.json (Jefe de proyecto) es opcional: si aun no existe (404), se borra la copia vieja
            try { Invoke-WebRequest -Uri "$RawBase/$sha/interno/proyecto.json" -UseBasicParsing -OutFile (Join-Path $CacheDir 'proyecto.json.tmp'); Move-Item -Force (Join-Path $CacheDir 'proyecto.json.tmp') (Join-Path $CacheDir 'proyecto.json') }
            catch { Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $CacheDir 'proyecto.json.tmp'), (Join-Path $CacheDir 'proyecto.json') }
            if ($sha -ne $shaPrev) { $vistoEn = Get-Date }
            Set-Content -Path $EstSha -Value ($sha + '|' + ($(if ($vistoEn) { $vistoEn } else { Get-Date })).ToString('yyyy-MM-dd HH:mm:ss'))
        } catch { Log ('ERROR al descargar el commit ' + $sha + ': ' + $_.Exception.Message) }
    }
    function LeerCache([string]$f) { Get-Content -Path (Join-Path $CacheDir $f) -Raw -Encoding UTF8 | ConvertFrom-Json }
    try {
        $dest = (LeerCache 'destinatarios.json').destinatarios
    } catch { Log ('ERROR al leer destinatarios: ' + $_.Exception.Message); return }

    # --- 0b. Plazos desde proceso.json (v11, LM-12) ---
    $ProcVer = ''; $PlazosOrigen = 'constantes del script'
    function PlazoNum($v, $def) { try { $n = [int]$v; if ($n -gt 0) { return $n } } catch { }; return $def }
    try {
        $proc = LeerCache 'proceso.json'
        $ProcVer = [string]$proc.version
        if (([string]$proc.estado) -eq 'vigente') {
            $ph = $proc.supervisor.plazosHoy
            $RecMin = PlazoNum $ph.RecMin $RecMin; $RecCada = PlazoNum $ph.RecCada $RecCada; $EscCada = PlazoNum $ph.EscCada $EscCada
            $FallaCada = PlazoNum $ph.FallaCada $FallaCada; $VerifMin = PlazoNum $ph.VerifMin $VerifMin; $VerifCada = PlazoNum $ph.VerifCada $VerifCada
            $EscMin = PlazoNum $proc.mensajes.plazos.escalamientoMin $EscMin
            foreach ($e in @($proc.lote.estados)) {
                switch ([string]$e.id) {
                    'construyendo' { $CliMin = PlazoNum $e.plazoMin $CliMin }
                    'fallido' { $FallaMin = PlazoNum $e.plazoMin $FallaMin }
                    'verificando' { $VerifMin = PlazoNum $e.plazoMin $VerifMin }
                }
            }
            $PlazosOrigen = 'proceso.json ' + $ProcVer
        }
    } catch { Log ('Aviso: proceso.json no se pudo leer (' + $_.Exception.Message + '); se usan las constantes.') }

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
                if (-not (BuscarDest $dest $para)) {
                    $yaS = if (Test-Path $EstSinS) { @(Get-Content -Path $EstSinS) } else { @() }
                    if ($yaS -notcontains $id) { Add-Content -Path $EstSinS -Value $id; Log "Sin sesion registrada para el destinatario de $id; espera a que se registre." }
                    continue
                }
                $texto = "Revisa el buzon (interno/mensajes.json): tienes el mensaje pendiente $id."
                $dPara = BuscarDest $dest $para
                if (([string]$dPara.canal) -eq 'windows') { $texto = "$id de $($m.de): $($m.asunto). Detalle en el Panel STR o en interno/mensajes.json." }
                if (Avisar ([string]$m.para) $texto $dest) { Add-Content -Path $EstMsg -Value $id; Add-Content -Path $EstHora -Value ($id + '|' + (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')); Log "$id avisado a $($m.para)." }
            }
        }
    } catch { Log ('ERROR en buzon: ' + $_.Exception.Message) }


    # --- 1c. Respuestas al remitente (v10, LM-2) ---
    # Un mensaje enviado por un chat que pasa a 'hecho' con respuesta avisa a quien lo envio (una vez).
    try {
        $yaResp = if (Test-Path $EstResp) { @(Get-Content -Path $EstResp) } else { @() }
        if (-not (Test-Path $EstResp)) {
            # primera corrida: marcar lo ya respondido sin avisar
            $msgs | Where-Object { $_.estado -eq 'hecho' -and $_.respuesta } | ForEach-Object { Add-Content -Path $EstResp -Value ([string]$_.id) }
            Log 'Inicio respuestas: marcadas sin avisar.'
        } else {
            foreach ($m in $msgs) {
                $id = [string]$m.id
                if ($id -notmatch '^M-\d+$' -or $m.estado -ne 'hecho' -or -not $m.respuesta -or $yaResp -contains $id) { continue }
                $de = [string]$m.de
                $dDe = BuscarDest $dest $de
                if (-not $dDe -or ([string]$dDe.canal) -eq 'windows') { Add-Content -Path $EstResp -Value $id; continue }   # Carlos o remitente desconocido: no se avisa
                $deResp = ''; try { $deResp = [string]$m.respuesta.de } catch { }
                if ($deResp -and ((Nom $deResp) -eq (Nom $de))) { Add-Content -Path $EstResp -Value $id; continue }   # v10.2: el remitente cerro su propio mensaje (p. ej. uno para Carlos): no se avisa a si mismo
                $texto = "Respondieron $id en el buzon (interno/mensajes.json): lee la respuesta y sigue con lo que esperaba."
                if (Avisar ([string]$dDe.nombre) $texto $dest) { Add-Content -Path $EstResp -Value $id; Log "$id respondido: avisado a $($dDe.nombre)." }
            }
        }
    } catch { Log ('ERROR en respuestas: ' + $_.Exception.Message) }

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
            $dis = JefeProyecto $dest
            $porDest = @{}
            foreach ($m in $msgs) {
                $id = [string]$m.id
                if ($m.estado -ne 'pendiente' -or -not $horas.ContainsKey($id)) { continue }
                $min = ($ahoraE - $horas[$id]).TotalMinutes
                if ($min -lt $RecMin) { continue }
                $dPx = BuscarDest $dest ([string]$m.para); $para = $(if ($dPx) { [string]$dPx.nombre } else { [string]$m.para })
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
            $ver = @(Get-ChildItem -Path $LogDir -Filter '*veredicto*.json' -File | Where-Object { $_.Name -match '^(?:L-)?\d{1,3}-veredicto[A-Za-z0-9-]*\.json$' } | Sort-Object LastWriteTime)
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
                    $estado = if ($l -match '\bFALLO\b') { 'FALLO' } elseif ($l -match '\bOK\b') { 'OK' } elseif ($l -match '\bRECHAZADO\b') { 'RECHAZADO' } else { '' }
                    if (-not $estado) { Set-Content -Path $EstCola -Value ($i + 1); continue }
                    $num = if ($l -match '(\d{1,3})-instr') { $Matches[1] } elseif ($l -match '\|\s*(\d{1,3})\b') { $Matches[1] } else { '' }
                    $texto = if ($estado -eq 'RECHAZADO') { "La cola rechazo el lote ${num}: es critico y su cabecera no cita DA-n ni el cruce con Carlos; quedo como .sin-cruce.md. Corrige la cabecera y renombralo." } elseif ($num) { "La CLI termino el lote $num ($estado): revisa la cola." } else { "La CLI termino un lote ($estado): revisa la cola." }
                    if (Avisar 'Chat de desarrollo' $texto $dest) { Set-Content -Path $EstCola -Value ($i + 1); Log "Cola: lote $num $estado avisado a Chat de desarrollo." }
                    else { break }
                }
            }
        }
    } catch { Log ('ERROR en cola: ' + $_.Exception.Message) }

    # --- 4. Vigia de estancamiento ---
    try {
        $dv = JefeProyecto $dest
        $ahora = Get-Date
        $hayActivo = $true
        try { $dz = $(if (Test-Path (Join-Path $CacheDir 'proyecto.json')) { LeerCache 'proyecto.json' } else { LeerCache 'diseno.json' }); $pls = @($dz.planes); if ($pls.Count -gt 0) { $hayActivo = (@($pls | Where-Object { ([string]$_.estado) -match '^activo' }).Count -gt 0) } } catch { }
        if ($dv -and $hayActivo -and $ahora.Hour -ge $VigiaDesde -and $ahora.Hour -lt $VigiaHasta) {
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
                $num = if ($f.Name -match '^(?:L-)?(\d{1,3})-') { $Matches[1] } else { $f.BaseName }
                $copia = Join-Path $Cola $f.Name
                $texto = if ((Test-Path $copia) -and ((Get-Item $copia).LastWriteTime -gt $f.LastWriteTime)) {
                    "La cola esta detenida: hay una copia nueva del lote $num en la cola, pero no corre mientras siga fallidas\$($f.Name). Pidele a Carlos que borre ese archivo."
                } else {
                    "La cola esta detenida: el lote $num esta en fallidas\ y no corre ningun lote mientras siga ahi. Revisa log\$($f.BaseName).txt y resuelvelo."
                }
                if (Avisar 'Chat de desarrollo' $texto $dest) {
                    Log "Cola detenida: lote $num en fallidas avisado a Chat de desarrollo."
                    if ($ult) {
                        $dv5 = JefeProyecto $dest
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
            # v10: pre-vuelo. Al escribirse verificar.json debia existir pre-vuelo.json valido y de menos de $PreVueloMin min.
            try {
                $claveP = 'verificar@' + $fv.LastWriteTime.ToString('yyyyMMddHHmmss')
                if (-not (Test-Path $EstPreV)) { Add-Content -Path $EstPreV -Value $claveP; Log 'Inicio pre-vuelo: lanzamiento actual marcado sin avisar.' }
                $yaP = @(Get-Content -Path $EstPreV)
                if ($yaP -notcontains $claveP) {
                    $pv = Join-Path $LogDir 'pre-vuelo.json'; $motivoP = ''
                    if (-not (Test-Path $pv)) { $motivoP = 'no existe pre-vuelo.json' }
                    else {
                        $fp = Get-Item $pv
                        if ($fp.LastWriteTime -gt $fv.LastWriteTime.AddMinutes(1)) { $motivoP = '' }
                        elseif (($fv.LastWriteTime - $fp.LastWriteTime).TotalMinutes -gt $PreVueloMin) { $motivoP = 'pre-vuelo.json tenia mas de ' + $PreVueloMin + ' min' }
                        else { try { $pj = Get-Content -Path $pv -Raw -Encoding UTF8 | ConvertFrom-Json; if (-not $pj.valido) { $motivoP = 'pre-vuelo.json con valido=false' } } catch { $motivoP = 'pre-vuelo.json ilegible' } }
                    }
                    if ($motivoP) {
                        if (Avisar 'Chat de desarrollo' ("Lanzaste el verificador del lote $loteV sin pre-vuelo valido ($motivoP). Escribe log\pre-vuelo.json como dice interno/lotes-modelo/LM-1.md y relanza con archivo de veredicto nuevo.") $dest) { Add-Content -Path $EstPreV -Value $claveP; Log "Pre-vuelo: lote $loteV lanzado sin pre-vuelo valido ($motivoP); avisado." }
                    } else { Add-Content -Path $EstPreV -Value $claveP }
                }
            } catch { Log ('ERROR en pre-vuelo: ' + $_.Exception.Message) }
            $entregado = ($arch -and (Test-Path (Join-Path $Cola $arch)))
            if (-not $entregado -and $loteV) {
                $otro = @(Get-ChildItem -Path $LogDir -Filter ('*' + $loteV + '-veredicto*.json') -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt $fv.LastWriteTime })
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

    # --- 7. CLI sin avance (v9, 10-oct-2026; v11.4, 21-oct-2026) ---
    # Si la cola tiene .corriendo desde hace $CliMin min o mas y el log del lote no cambia desde hace $CliMin min,
    # la CLI quedo esperando algo o murio (ejecutar-cola.ps1 limpia el candado a los 90 min). Primer aviso al Chat
    # de desarrollo; si sigue, cada $CliCada min se repite y Carlos recibe el paso exacto.
    try {
        $lockC = Join-Path $Cola '.corriendo'
        if (Test-Path $lockC) {
            $fl = Get-Item -Force $lockC; $ahoraC = Get-Date
            # v11.4 (M-1095): un candado leido mientras la cola lo crea trae LastWriteTime 1601 (fecha cero de Windows) y una
            # "edad" de millones de minutos; tambien puede desaparecer en segundos (pasada sin lotes). Se relee a los 3 s y,
            # si ya no esta o su fecha es anterior a 2000, no es un lote colgado: se ignora en esta pasada.
            Start-Sleep -Seconds 3
            if (-not (Test-Path $lockC)) { throw 'candado-efimero' }
            $fl = Get-Item -Force $lockC; $ahoraC = Get-Date
            if ($fl.LastWriteTime.Year -lt 2000) { throw 'candado-sin-fecha' }
            $edadC = ($ahoraC - $fl.LastWriteTime).TotalMinutes
            $ultLog = Get-ChildItem -Path $LogDir -Filter '*-instr-*.txt' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1
            $quieto = (-not $ultLog) -or (($ahoraC - $ultLog.LastWriteTime).TotalMinutes -ge $CliMin)
            $claveC = 'cli@' + $fl.LastWriteTime.ToString('yyyyMMddHHmmss')
            $prevC = if (Test-Path $EstCli) { ([string](Get-Content -Path $EstCli | Select-Object -First 1)) -split '\|' } else { @('') }
            $ultC = $null; if ($prevC[0] -eq $claveC -and $prevC.Count -gt 1 -and $prevC[1]) { try { $ultC = [DateTime]::Parse($prevC[1]) } catch { } }
            if ($edadC -ge $CliMin -and $quieto -and ((-not $ultC) -or (($ahoraC - $ultC).TotalMinutes -ge $CliCada))) {
                $numC = if ($ultLog -and $ultLog.Name -match '^(?:L-)?(\d{1,3})-') { $Matches[1] } else { '?' }
                $desdeC = $fl.LastWriteTime.ToString('HH:mm')
                $t7 = "La CLI lleva " + [int]$edadC + " min con el lote $numC (desde las $desdeC) y su log no cambia. Revisa en LENOVO si claude.exe sigue corriendo o quedo esperando; si murio, se limpia solo a los 90 min."
                if (Avisar 'Chat de desarrollo' $t7 $dest) {
                    Log "CLI sin avance: lote $numC avisado a Chat de desarrollo."
                    if ($ultC) { [void](Avisar 'Carlos' ("La CLI sigue sin avanzar con el lote $numC desde las $desdeC. Mira en LENOVO si hay una ventana de claude.exe esperando algo.") $dest) }
                    Set-Content -Path $EstCli -Value ($claveC + '|' + $ahoraC.ToString('yyyy-MM-dd HH:mm:ss'))
                }
            }
        } elseif (Test-Path $EstCli) { Remove-Item -Path $EstCli -Force -ErrorAction SilentlyContinue }
    } catch { if ($_.Exception.Message -notmatch '^candado-') { Log ('ERROR en cli: ' + $_.Exception.Message) } }

    # --- 7b. Pruebas y juez local (v11.2, LM-18/LM-19) ---
    # Avisa al Chat de desarrollo, una vez por archivo: lote bloqueado en la puerta de entrada (L-n-pruebas.json),
    # guion o regresion en rojo, y juez sin veredicto 20 min despues de las pruebas (el veredicto escrito ya lo avisa
    # la seccion de veredictos-avisados).
    # Estado: pruebas-avisadas.txt (nombres de archivo y claves sinjuez:<archivo>). Primera vez: marca sin avisar.
    try {
        $EstPru = Join-Path $Base 'pruebas-avisadas.txt'
        $arch7 = @(Get-ChildItem -Path $LogDir -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^L-\d+-(pruebas|veredicto(-\d+)?)\.json$' })
        if (-not (Test-Path $EstPru)) {
            Set-Content -Path $EstPru -Value '# pruebas y veredictos ya avisados (v11.2)'
            foreach ($fa in $arch7) { Add-Content -Path $EstPru -Value $fa.Name; Add-Content -Path $EstPru -Value ('sinjuez:' + $fa.Name) }
            Log 'Inicio pruebas/juez: archivos actuales marcados sin avisar.'
        }
        $ya7 = @(Get-Content -Path $EstPru -ErrorAction SilentlyContinue)
        foreach ($fa in $arch7) {
            if ($ya7 -contains $fa.Name) { continue }
            if (((Get-Date) - $fa.LastWriteTime).TotalMinutes -lt 1) { continue }
            $lote7 = ($fa.Name -replace '^(L-\d+)-.*$', '$1')
            $j7 = $null; try { $j7 = Get-Content -Path $fa.FullName -Raw -Encoding UTF8 | ConvertFrom-Json } catch { }
            $t7 = $null
            if ($fa.Name -like '*-pruebas.json') {
                if ($j7 -and $j7.resultado -eq 'bloqueado') { $t7 = "Lote $lote7 bloqueado en la puerta de entrada de las pruebas (log\$($fa.Name)): $($j7.causa). Corrige la causa y reencola; no se gasto verificacion." }
                elseif ($j7 -and $j7.resultado -eq 'rojo') { $t7 = "Lote ${lote7}: el guion o la regresion fallan ($($j7.causa)). El juez local escribe el veredicto; si no aparece en 20 min te aviso." }
            }   # los veredictos (tambien los del juez) ya los avisa la seccion de veredictos-avisados
            if ((-not $t7) -or (Avisar 'Chat de desarrollo' $t7 $dest)) { Add-Content -Path $EstPru -Value $fa.Name; if ($t7) { Log "Pruebas/juez: $($fa.Name) avisado." } }
        }
        foreach ($fp7 in @($arch7 | Where-Object { $_.Name -like '*-pruebas.json' })) {
            $clave7 = 'sinjuez:' + $fp7.Name
            if ($ya7 -contains $clave7) { continue }
            if (((Get-Date) - $fp7.LastWriteTime).TotalMinutes -lt 20) { continue }
            $j7 = $null; try { $j7 = Get-Content -Path $fp7.FullName -Raw -Encoding UTF8 | ConvertFrom-Json } catch { }
            if ((-not $j7) -or ($j7.resultado -ne 'verde' -and $j7.resultado -ne 'rojo')) { Add-Content -Path $EstPru -Value $clave7; continue }
            $lote7 = ($fp7.Name -replace '^(L-\d+)-.*$', '$1')
            $hay7 = @(Get-ChildItem -Path $LogDir -Filter ($lote7 + '-veredicto*.json') -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt $fp7.LastWriteTime })
            if ($hay7.Count -gt 0) { Add-Content -Path $EstPru -Value $clave7; continue }
            $t7b = "El juez local no dejo veredicto del lote $lote7 (pruebas $($j7.resultado) desde las " + $fp7.LastWriteTime.ToString('HH:mm') + "). Mira log\$lote7-juez.txt y lanza la tarea de Cowork de respaldo (pre-vuelo y verificar.json como antes)."
            if (Avisar 'Chat de desarrollo' $t7b $dest) { Add-Content -Path $EstPru -Value $clave7; Log "Juez sin veredicto: $lote7 avisado." }
        }
    } catch { Log ('ERROR en pruebas/juez: ' + $_.Exception.Message) }

    # --- 8. Estado vivo (v10, LM-2): lo mecanico al minuto, para el Panel (y mas adelante el tablero) ---
    try {
        $ev = [ordered]@{ actualizadoEn = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'); proyecto = 'str'; jornada = $(if (Test-Path (Join-Path $Cola 'PAUSA')) { 'pausa' } else { 'activa' }) }
        $ev.enCola = @(Get-ChildItem -Path $Cola -Filter '*-instr-*.md' -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch '\.sin-cruce\.md$' } | Sort-Object Name | ForEach-Object { $_.Name })
        $ev.rechazados = @(Get-ChildItem -Path $Cola -Filter '*.sin-cruce.md' -File -ErrorAction SilentlyContinue | ForEach-Object { $_.Name })
        $lk = Join-Path $Cola '.corriendo'
        $ev.construyendo = $(if (Test-Path $lk) { $fl2 = Get-Item -Force $lk; $ul = Get-ChildItem -Path $LogDir -Filter '*-instr-*.txt' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1; [ordered]@{ desde = $fl2.LastWriteTime.ToString('HH:mm'); lote = $(if ($ul) { $ul.BaseName } else { '' }); logHace = $(if ($ul) { [int]((Get-Date) - $ul.LastWriteTime).TotalMinutes } else { $null }) } } else { $null })
        $ev.fallidas = @(Get-ChildItem -Path (Join-Path $Cola 'fallidas') -Filter '*.md' -File -ErrorAction SilentlyContinue | ForEach-Object { $_.Name })
        $vj2 = Join-Path $LogDir 'verificar.json'; $pv2 = Join-Path $LogDir 'pre-vuelo.json'
        $ev.verificando = $(if (Test-Path $vj2) { $fv2 = Get-Item $vj2; $v2 = $null; try { $v2 = Get-Content -Path $vj2 -Raw -Encoding UTF8 | ConvertFrom-Json } catch { }; $arch2 = $(if ($v2) { [string]$v2.archivoVeredicto } else { '' }); [ordered]@{ lote = $(if ($v2) { [string]$v2.lote } else { '' }); desde = $fv2.LastWriteTime.ToString('HH:mm'); archivoEsperado = $arch2; entregado = ($arch2 -and (Test-Path (Join-Path $Cola $arch2))); preVuelo = $(if (Test-Path $pv2) { (Get-Item $pv2).LastWriteTime.ToString('HH:mm') } else { '' }) } } else { $null })
        $ev.ultimoResumen = $(if (Test-Path $Resumen) { [string](Get-Content -Path $Resumen -Tail 1) } else { '' })
        # v11 (LM-12): plazos en vigor y metricas mecanicas (ventana de 7 dias)
        try {
            $okHoras = @{}
            if (Test-Path $Resumen) { foreach ($l in @(Get-Content -Path $Resumen)) { if (([string]$l) -match '^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) \| OK \| (?:L-)?(\d{1,3})-instr') { try { $okHoras[$Matches[2]] = [DateTime]::ParseExact($Matches[1], 'yyyy-MM-dd HH:mm', $null) } catch { } } } }
            $desde7 = (Get-Date).AddDays(-7)
            $vers = @(Get-ChildItem -Path $LogDir -Filter '*veredicto*.json' -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^(?:L-)?\d{1,3}-veredicto' -and $_.LastWriteTime -ge $desde7 })
            $porLote = @{}; $mins = @(); $bloqHoy = 0
            foreach ($vf in $vers) {
                $n = $(if ($vf.Name -match '^(?:L-)?(\d{1,3})-') { $Matches[1] } else { '' })
                if (-not $porLote.ContainsKey($n)) { $porLote[$n] = 0 }
                $porLote[$n] = $porLote[$n] + 1
                if ($vf.Name -match 'bloqueado' -and $vf.LastWriteTime.Date -eq (Get-Date).Date) { $bloqHoy++ }
                $res = ''; try { $res = [string](Get-Content -Path $vf.FullName -Raw -Encoding UTF8 | ConvertFrom-Json).resultado } catch { }
                if ($res -eq 'aceptado' -and $okHoras.ContainsKey($n)) { $mins += [int]($vf.LastWriteTime - $okHoras[$n]).TotalMinutes }
            }
            $mediana = $null; if ($mins.Count -gt 0) { $sm = @($mins | Sort-Object); $mediana = $sm[[int][Math]::Floor(($sm.Count - 1) / 2)] }
            $masDeUno = @($porLote.Keys | Where-Object { $porLote[$_] -gt 1 }).Count
            $pendC = @($msgs | Where-Object { $_.estado -eq 'pendiente' -and (Nom ([string]$_.para)) -eq 'carlos' })
            $masAnt = $null
            foreach ($mc in $pendC) { try { $tm = [DateTime]::ParseExact(([string]$mc.fecha + ' ' + [string]$mc.hora), 'yyyy-MM-dd HH:mm', $null); $dm = [int]((Get-Date) - $tm).TotalMinutes; if ($masAnt -eq $null -or $dm -gt $masAnt) { $masAnt = $dm } } catch { } }
            $ev.plazos = [ordered]@{ origen = $PlazosOrigen; verificadorMin = $VerifMin; cliMin = $CliMin; fallidasMin = $FallaMin; recordatorioMin = $RecMin; escalamientoMin = $EscMin }
            $ev.metricas = [ordered]@{ ventanaDias = 7; construidoAceptadoMedianaMin = $mediana; lotesMedidos = $mins.Count; lotesConVeredicto = $porLote.Count; lotesConMasDeUnVeredicto = $masDeUno; bloqueadosHoy = $bloqHoy; esperaDueno = [ordered]@{ pendientes = $pendC.Count; masAntiguoMin = $masAnt } }
        } catch { Log ('ERROR en metricas: ' + $_.Exception.Message) }
        ($ev | ConvertTo-Json -Depth 4) | Set-Content -Path $EstadoVivo -Encoding UTF8
    } catch { Log ('ERROR en estado vivo: ' + $_.Exception.Message) }
} finally {
    Remove-Item -Path $Lock -Force -ErrorAction SilentlyContinue
}
