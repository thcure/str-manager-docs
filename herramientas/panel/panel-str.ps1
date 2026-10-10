# panel-str.ps1 - Panel de jornada del STR (Arquitecto, 2026-10-10; v2: lista lo que espera de Carlos)
# Ventana con tres botones: Empezar jornada, Terminar jornada y Estado.
#  - Empezar: quita el archivo PAUSA de la cola y abre los perfiles de Chrome del verificador con el STR.
#  - Terminar: crea PAUSA. El lote que esté corriendo termina; no empieza otro y el despertador no avisa.
#  - Estado: muestra lo que espera de Carlos (buzón), cola, lote en curso, verificación, despertador y perfiles abiertos.
# No inicia sesión en ningún sitio ni guarda contraseñas. No usa Claude (no gasta créditos).
# Configuración: panel-config.json en esta misma carpeta (nombres de los perfiles de Chrome).
# Se abre con el acceso directo del escritorio (lanzar-panel.vbs).

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$Cola    = Join-Path $HOME 'Downloads\str-instr-cola'
$Pausa   = Join-Path $Cola 'PAUSA'
$LogDir  = Join-Path $Cola 'log'
$Buzon   = Join-Path $Cola 'buzon'
$Aqui    = Split-Path -Parent $MyInvocation.MyCommand.Path
$Config  = Join-Path $Aqui 'panel-config.json'

function Leer-Config {
    $def = [pscustomobject]@{
        url = 'https://app.apartamentosbucaramanga.com/str-app-shell.html'
        perfiles = @(
            [pscustomobject]@{ rol = 'Administrador'; nombre = ''; carpeta = 'Default' },
            [pscustomobject]@{ rol = 'Colaborador';   nombre = 'valeriaramos.xyz'; carpeta = '' },
            [pscustomobject]@{ rol = 'Operador';      nombre = 'STR operador'; carpeta = '' }
        )
    }
    if (Test-Path $Config) {
        try { return (Get-Content -Path $Config -Raw -Encoding UTF8 | ConvertFrom-Json) } catch { }
    }
    return $def
}

function Buscar-Chrome {
    $c = @(
        (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'),
        (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe')
    )
    foreach ($x in $c) { if ($x -and (Test-Path $x)) { return $x } }
    return $null
}

# Carpeta del perfil de Chrome a partir del nombre que se ve en Chrome (Local State).
function Carpeta-Perfil($p) {
    if ($p.carpeta) { return [string]$p.carpeta }
    $ls = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data\Local State'
    if (-not (Test-Path $ls)) { return $null }
    try {
        $j = Get-Content -Path $ls -Raw -Encoding UTF8 | ConvertFrom-Json
        $q = ([string]$p.nombre).Trim().ToLower()
        if (-not $q) { return $null }
        foreach ($prop in $j.profile.info_cache.PSObject.Properties) {
            $v = $prop.Value
            $campos = @([string]$v.name, [string]$v.user_name, [string]$v.gaia_name, [string]$v.gaia_given_name, [string]$v.shortcut_name) | ForEach-Object { $_.ToLower() }
            if ($campos -contains $q) { return $prop.Name }
        }
        foreach ($prop in $j.profile.info_cache.PSObject.Properties) {
            $v = $prop.Value
            $todo = (([string]$v.name) + ' ' + ([string]$v.user_name) + ' ' + ([string]$v.gaia_name)).ToLower()
            if ($todo.Contains($q)) { return $prop.Name }
        }
    } catch { }
    return $null
}

function Lista-Perfiles {
    $ls = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data\Local State'
    $r = @()
    try {
        $j = Get-Content -Path $ls -Raw -Encoding UTF8 | ConvertFrom-Json
        foreach ($prop in $j.profile.info_cache.PSObject.Properties) { $r += ('    carpeta "' + $prop.Name + '" = nombre "' + [string]$prop.Value.name + '"' + $(if ($prop.Value.user_name) { ' (' + [string]$prop.Value.user_name + ')' } else { '' })) }
    } catch { }
    return $r
}

function Perfiles-Abiertos {
    $abiertos = @{}
    # Chrome anota en Local State los perfiles con ventana abierta (last_active_profiles).
    try {
        $ls = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data\Local State'
        $j = Get-Content -Path $ls -Raw -Encoding UTF8 | ConvertFrom-Json
        foreach ($x in @($j.profile.last_active_profiles)) { if ($x) { $abiertos[[string]$x] = $true } }
    } catch { }
    try {
        $procs = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction Stop
        foreach ($pr in $procs) {
            $cl = [string]$pr.CommandLine
            if ($cl -match '--profile-directory="?([^"]+?)"?(\s|$)') { $abiertos[$Matches[1]] = $true }
            elseif ($cl -and $cl -notmatch '--type=') { $abiertos['Default'] = $true }
        }
    } catch { }
    return $abiertos
}

# Tokens de GitHub en claves\ : GitHub informa su vencimiento en la cabecera github-authentication-token-expiration.
$Claves = Join-Path $Cola 'claves'
function Estado-Tokens {
    $r = @()
    foreach ($par in @(@('Desarrollo','desarrollo.txt'), @('Diseno','diseno.txt'), @('Arquitecto','arquitecto.txt'))) {
        $ruta = Join-Path $Claves $par[1]
        $o = [pscustomobject]@{ chat = $par[0]; dias = $null; texto = '' }
        if (-not (Test-Path $ruta)) { $o.texto = 'sin archivo'; $r += $o; continue }
        $raw = Get-Content -Path $ruta -Raw -ErrorAction SilentlyContinue
        $tok = if ($raw) { ([string]$raw).Trim() } else { '' }
        if (-not $tok) { $o.texto = 'archivo vacio'; $r += $o; continue }
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $resp = Invoke-WebRequest -Uri 'https://api.github.com/rate_limit' -UseBasicParsing -Headers @{ Authorization = "Bearer $tok"; 'User-Agent' = 'panel-str' } -ErrorAction Stop
            $exp = [string]$resp.Headers['github-authentication-token-expiration']
            if (-not $exp) { $o.texto = 'valido, sin fecha de vencimiento'; $r += $o; continue }
            $d = [DateTime]::Parse(($exp -replace ' UTC$', 'Z')).ToLocalTime()
            $o.dias = [math]::Floor(($d - (Get-Date)).TotalDays)
            $o.texto = 'vence el ' + $d.ToString('dd-MM-yyyy HH:mm') + ' (' + $o.dias + ' dias)'
        } catch {
            $o.dias = -1; $o.texto = 'NO FUNCIONA (vencido o revocado): regeneralo en GitHub y reemplaza ' + $par[1]
        }
        $r += $o
    }
    return $r
}

function Avisos-Tokens {
    $a = @()
    foreach ($t in (Estado-Tokens)) { if ($t.dias -ne $null -and $t.dias -le 7) { $a += ('ATENCION token de ' + $t.chat + ': ' + $t.texto) } elseif ($t.texto -like 'sin archivo*' -or $t.texto -like 'archivo vacio*') { $a += ('ATENCION token de ' + $t.chat + ': ' + $t.texto) } }
    return $a
}

function Ultima-Linea($ruta) {
    if (Test-Path $ruta) { $l = Get-Content -Path $ruta -Tail 1 -ErrorAction SilentlyContinue; if ($l) { return [string]$l } }
    return '-'
}

function Texto-Estado {
    $cfg = Leer-Config
    $s = New-Object System.Text.StringBuilder
    if (Test-Path $Pausa) { [void]$s.AppendLine('Jornada: EN PAUSA desde ' + (Get-Item $Pausa).LastWriteTime.ToString('dd-MM HH:mm')) }
    else { [void]$s.AppendLine('Jornada: ACTIVA (cola y despertador trabajando)') }
    # Lo que espera de Carlos (v2, 10-oct-2026): mensajes 'pendiente' para Carlos en la copia del buzon del despertador.
    try {
        $mj = Join-Path $Buzon 'cache\mensajes.json'
        if (Test-Path $mj) {
            $pc = @(((Get-Content -Path $mj -Raw -Encoding UTF8 | ConvertFrom-Json).mensajes) | Where-Object { ([string]$_.para) -eq 'Carlos' -and ([string]$_.estado) -eq 'pendiente' })
            if ($pc.Count -gt 0) {
                [void]$s.AppendLine('')
                [void]$s.AppendLine('ESPERAN DE TI (' + $pc.Count + '):')
                foreach ($m in $pc) { [void]$s.AppendLine('  ' + [string]$m.id + ' ' + [string]$m.hora + ' de ' + [string]$m.de + ': ' + [string]$m.asunto); [void]$s.AppendLine('      ' + [string]$m.texto) }
                [void]$s.AppendLine('')
            }
        }
    } catch { }
    $lock = Join-Path $Cola '.corriendo'
    if (Test-Path $lock) { [void]$s.AppendLine('Cola: CONSTRUYENDO un lote desde ' + (Get-Item $lock).LastWriteTime.ToString('HH:mm')) }
    else { [void]$s.AppendLine('Cola: sin lote corriendo') }
    $pend = @(Get-ChildItem -Path $Cola -Filter '*-instr-*.md' -File -ErrorAction SilentlyContinue)
    [void]$s.AppendLine('Lotes esperando en la cola: ' + $pend.Count)
    $fall = @(Get-ChildItem -Path (Join-Path $Cola 'fallidas') -Filter '*.md' -File -ErrorAction SilentlyContinue)
    if ($fall.Count -gt 0) { [void]$s.AppendLine('ATENCION: hay ' + $fall.Count + ' lote(s) fallido(s); la cola espera al Chat de desarrollo') }
    [void]$s.AppendLine('Ultimo lote: ' + (Ultima-Linea (Join-Path $LogDir '_resumen.txt')))
    $vj = Join-Path $LogDir 'verificar.json'
    if (Test-Path $vj) {
        try {
            $v = Get-Content -Path $vj -Raw -Encoding UTF8 | ConvertFrom-Json
            $ver = Join-Path $LogDir ([string]$v.archivoVeredicto)
            if (Test-Path $ver) { $est = 'con veredicto (' + [string]$v.archivoVeredicto + ')' }
            else {
                $ult = Get-ChildItem -Path $LogDir -Filter ([string]$v.lote + '-veredicto*.json') -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1
                $est = 'preparada o en curso (espera ' + [string]$v.archivoVeredicto + ')'
                if ($ult) { $est += '; ultimo veredicto: ' + $ult.Name + ' ' + $ult.LastWriteTime.ToString('HH:mm') }
            }
            [void]$s.AppendLine('Verificacion: lote ' + $v.lote + ' - ' + $est)
        } catch { }
    }
    [void]$s.AppendLine('Despertador, ultimo aviso: ' + (Ultima-Linea (Join-Path $Buzon 'buzon.log')))
    [void]$s.AppendLine('')
    [void]$s.AppendLine('Tokens de GitHub:')
    foreach ($t in (Estado-Tokens)) { [void]$s.AppendLine('  ' + $t.chat + ': ' + $t.texto + $(if ($t.dias -ne $null -and $t.dias -le 7) { '  <-- RENOVAR' } else { '' })) }
    [void]$s.AppendLine('')
    [void]$s.AppendLine('Perfiles de Chrome:')
    $faltan = $false
    $ab = Perfiles-Abiertos
    foreach ($p in $cfg.perfiles) {
        $dir = Carpeta-Perfil $p
        $txt = if (-not $dir) { 'no encontrado (revisa panel-config.json)' } elseif ($ab.ContainsKey($dir)) { 'abierto' } else { 'cerrado' }
        [void]$s.AppendLine('  ' + $p.rol + ': ' + $txt)
        if (-not $dir) { $faltan = $true }
    }
    if ($faltan) {
        [void]$s.AppendLine('')
        [void]$s.AppendLine('Perfiles que tiene tu Chrome (para ajustar panel-config.json):')
        foreach ($l in (Lista-Perfiles)) { [void]$s.AppendLine($l) }
    }
    return $s.ToString()
}

function Empezar {
    if (Test-Path $Pausa) { Remove-Item -Path $Pausa -Force }
    $cfg = Leer-Config
    $chrome = Buscar-Chrome
    $avisos = @()
    if (-not $chrome) { $avisos += 'No encontre Chrome instalado.' }
    else {
        $ab = Perfiles-Abiertos
        foreach ($p in $cfg.perfiles) {
            $dir = Carpeta-Perfil $p
            if (-not $dir) { $avisos += ('No encontre el perfil de ' + $p.rol + ' (' + $p.nombre + ').'); continue }
            if (-not $ab.ContainsKey($dir)) {
                Start-Process -FilePath $chrome -ArgumentList @("--profile-directory=`"$dir`"", $cfg.url)
                Start-Sleep -Milliseconds 800
            }
        }
    }
    $msg = "Jornada ACTIVA. Se abrieron los perfiles que estaban cerrados (puede tardar unos segundos en verse en Estado).`r`nSi alguno pide iniciar sesion, entra con el usuario de ese perfil:`r`n  Administrador: zz-verif-admin`r`n  Colaborador: zz-verif-colab`r`n  Operador: zz-verif-oper"
    $avisos += (Avisos-Tokens)
    if ($avisos.Count) { $msg += "`r`n`r`n" + ($avisos -join "`r`n") }
    return $msg
}

function Terminar {
    Set-Content -Path $Pausa -Value ('Pausa pedida desde el panel: ' + (Get-Date).ToString('yyyy-MM-dd HH:mm'))
    $lock = Join-Path $Cola '.corriendo'
    if (Test-Path $lock) { return "Jornada EN PAUSA.`r`nHay un lote construyendose: termina solo y no empieza otro.`r`nEl despertador ya no avisa a los chats." }
    return "Jornada EN PAUSA.`r`nLa cola no empieza lotes y el despertador no avisa a los chats.`r`nPuedes cerrar los perfiles de Chrome si quieres."
}

# --- Ventana ---
$f = New-Object System.Windows.Forms.Form
$f.Text = 'Panel STR'
$f.Size = New-Object System.Drawing.Size(560, 470)
$f.StartPosition = 'CenterScreen'
$f.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$b1 = New-Object System.Windows.Forms.Button
$b1.Text = 'Empezar jornada'; $b1.Size = New-Object System.Drawing.Size(165, 44); $b1.Location = New-Object System.Drawing.Point(12, 12)
$b1.BackColor = [System.Drawing.Color]::FromArgb(220, 245, 225)

$b2 = New-Object System.Windows.Forms.Button
$b2.Text = 'Terminar jornada'; $b2.Size = New-Object System.Drawing.Size(165, 44); $b2.Location = New-Object System.Drawing.Point(187, 12)
$b2.BackColor = [System.Drawing.Color]::FromArgb(250, 230, 220)

$b3 = New-Object System.Windows.Forms.Button
$b3.Text = 'Estado'; $b3.Size = New-Object System.Drawing.Size(165, 44); $b3.Location = New-Object System.Drawing.Point(362, 12)

$t = New-Object System.Windows.Forms.TextBox
$t.Multiline = $true; $t.ReadOnly = $true; $t.ScrollBars = 'Vertical'
$t.Location = New-Object System.Drawing.Point(12, 68); $t.Size = New-Object System.Drawing.Size(515, 345)
$t.Font = New-Object System.Drawing.Font('Consolas', 9.5)

$b1.Add_Click({ $t.Text = (Empezar) + "`r`n`r`n" + (Texto-Estado) })
$b2.Add_Click({ $t.Text = (Terminar) + "`r`n`r`n" + (Texto-Estado) })
$b3.Add_Click({ $t.Text = Texto-Estado })

$f.Controls.AddRange(@($b1, $b2, $b3, $t))
$f.Add_Shown({ $t.Text = Texto-Estado })
[void]$f.ShowDialog()
