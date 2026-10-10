# panel-str.ps1 - Panel de jornada del STR (Arquitecto, 2026-10-10)
# Ventana con tres botones: Empezar jornada, Terminar jornada y Estado.
#  - Empezar: quita el archivo PAUSA de la cola y abre los perfiles de Chrome del verificador con el STR.
#  - Terminar: crea PAUSA. El lote que esté corriendo termina; no empieza otro y el despertador no avisa.
#  - Estado: muestra cola, lote en curso, verificación, despertador y perfiles abiertos.
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
        url = 'https://app.apartamentosbucaramanga.com'
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
        foreach ($prop in $j.profile.info_cache.PSObject.Properties) {
            $v = $prop.Value
            if ($v.name -eq $p.nombre -or $v.user_name -eq $p.nombre -or $v.gaia_name -eq $p.nombre) { return $prop.Name }
        }
    } catch { }
    return $null
}

function Perfiles-Abiertos {
    $abiertos = @{}
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

function Ultima-Linea($ruta) {
    if (Test-Path $ruta) { $l = Get-Content -Path $ruta -Tail 1 -ErrorAction SilentlyContinue; if ($l) { return [string]$l } }
    return '-'
}

function Texto-Estado {
    $cfg = Leer-Config
    $s = New-Object System.Text.StringBuilder
    if (Test-Path $Pausa) { [void]$s.AppendLine('Jornada: EN PAUSA desde ' + (Get-Item $Pausa).LastWriteTime.ToString('dd-MM HH:mm')) }
    else { [void]$s.AppendLine('Jornada: ACTIVA (cola y despertador trabajando)') }
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
            $est = if (Test-Path $ver) { 'con veredicto' } else { 'VERIFICANDO o por verificar' }
            [void]$s.AppendLine('Verificacion: lote ' + $v.lote + ' - ' + $est)
        } catch { }
    }
    [void]$s.AppendLine('Despertador, ultimo aviso: ' + (Ultima-Linea (Join-Path $Buzon 'buzon.log')))
    [void]$s.AppendLine('')
    [void]$s.AppendLine('Perfiles de Chrome:')
    $ab = Perfiles-Abiertos
    foreach ($p in $cfg.perfiles) {
        $dir = Carpeta-Perfil $p
        $txt = if (-not $dir) { 'no encontrado (revisa panel-config.json)' } elseif ($ab.ContainsKey($dir)) { 'abierto' } else { 'cerrado' }
        [void]$s.AppendLine('  ' + $p.rol + ': ' + $txt)
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
    $msg = "Jornada ACTIVA. Se abrieron los perfiles que estaban cerrados.`r`nSi alguno pide iniciar sesion, entra con el usuario de ese perfil:`r`n  Administrador: tu usuario`r`n  Colaborador: zz-verif-colab`r`n  Operador: zz-verif-oper"
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
