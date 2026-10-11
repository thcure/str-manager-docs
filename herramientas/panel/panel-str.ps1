# panel-str.ps1 - Panel de jornada del STR (Arquitecto; v3 2026-10-11, LM-3 / REQ-MOD-7)
# Ventana con tres botones: Empezar jornada, Terminar jornada y Estado.
#  - Empezar: quita el archivo PAUSA de la cola, abre los perfiles de Chrome de prueba con el STR
#             y comprueba que cada uno tenga ventana.
#  - Terminar: crea PAUSA y CIERRA las ventanas de Chrome de los perfiles de prueba (solo los que
#              estan en panel-config.json; nunca el perfil "Default" ni ningun otro). El lote que
#              este corriendo termina; no empieza otro y el despertador no avisa.
#  - Estado: lo que espera de Carlos (buzon), maquina (estado-vivo.json del despertador),
#            pre-vuelo del verificador (log\pre-vuelo.json), cola, tokens y perfiles.
# Como distingue las ventanas de cada perfil: Chrome marca cada ventana con un AppUserModelID
# que termina en el nombre de la carpeta del perfil (p. ej. "Chrome.Profile4"). El panel lee esa
# marca con la API de Windows; no toca procesos, no mata Chrome, solo pide cerrar esas ventanas.
# No inicia sesion en ningun sitio ni guarda contrasenas. No usa Claude (no gasta creditos).
# Configuracion: panel-config.json en esta misma carpeta (perfiles de prueba: carpeta o nombre).
# Se abre con el acceso directo del escritorio (lanzar-panel.vbs). Archivo ASCII (PowerShell 5.1).

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$Cola    = Join-Path $HOME 'Downloads\str-instr-cola'
$Pausa   = Join-Path $Cola 'PAUSA'
$LogDir  = Join-Path $Cola 'log'
$Buzon   = Join-Path $Cola 'buzon'
$Aqui    = Split-Path -Parent $MyInvocation.MyCommand.Path
$Config  = Join-Path $Aqui 'panel-config.json'

# --- Ventanas de Chrome por perfil (API de Windows) ---
$CsVentanas = @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public static class VentanasChrome {
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  [DllImport("shell32.dll")] static extern int SHGetPropertyStoreForWindow(IntPtr hwnd, ref Guid iid, [MarshalAs(UnmanagedType.Interface)] out IPropertyStore ps);
  [DllImport("ole32.dll")] static extern int PropVariantClear(ref PROPVARIANT v);
  [StructLayout(LayoutKind.Sequential)] struct PROPERTYKEY { public Guid fmtid; public uint pid; }
  [StructLayout(LayoutKind.Explicit)] struct PROPVARIANT { [FieldOffset(0)] public ushort vt; [FieldOffset(8)] public IntPtr p; }
  [ComImport, Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IPropertyStore {
    int GetCount(out uint c);
    int GetAt(uint i, out PROPERTYKEY k);
    int GetValue(ref PROPERTYKEY k, out PROPVARIANT v);
    int SetValue(ref PROPERTYKEY k, ref PROPVARIANT v);
    int Commit();
  }
  public static string Aumid(IntPtr h) {
    try {
      Guid iid = typeof(IPropertyStore).GUID;
      IPropertyStore ps;
      if (SHGetPropertyStoreForWindow(h, ref iid, out ps) != 0 || ps == null) return "";
      PROPERTYKEY k = new PROPERTYKEY();
      k.fmtid = new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"); k.pid = 5;
      PROPVARIANT v;
      ps.GetValue(ref k, out v);
      string s = "";
      if (v.vt == 31 && v.p != IntPtr.Zero) s = Marshal.PtrToStringUni(v.p);
      PropVariantClear(ref v);
      return s == null ? "" : s;
    } catch { return ""; }
  }
  public static List<string[]> Listar() {
    List<string[]> r = new List<string[]>();
    EnumWindows(delegate(IntPtr h, IntPtr l) {
      if (!IsWindowVisible(h)) return true;
      StringBuilder c = new StringBuilder(256); GetClassName(h, c, 256);
      if (c.ToString() != "Chrome_WidgetWin_1") return true;
      StringBuilder t = new StringBuilder(512); GetWindowText(h, t, 512);
      if (t.Length == 0) return true;
      r.Add(new string[] { h.ToInt64().ToString(), t.ToString(), Aumid(h) });
      return true;
    }, IntPtr.Zero);
    return r;
  }
  public static void Cerrar(long h) { PostMessage(new IntPtr(h), 0x0010, IntPtr.Zero, IntPtr.Zero); }
}
'@
try { if (-not ('VentanasChrome' -as [type])) { Add-Type -TypeDefinition $CsVentanas -ErrorAction Stop } } catch { }

function Norm([string]$s) { if ($null -eq $s) { return '' }; return (($s -replace '\s', '')).ToLower() }

function Ventanas-Chrome {
    try { return @([VentanasChrome]::Listar()) } catch { return @() }
}

# Ventanas cuyo AppUserModelID termina en la carpeta del perfil. Nunca "Default".
function Ventanas-DePerfil([string]$dir) {
    $d = Norm $dir
    if (-not $d -or $d -eq 'default') { return @() }
    $r = @()
    foreach ($v in (Ventanas-Chrome)) {
        $a = Norm $v[2]
        if ($a -and ($a -eq ('chrome.' + $d) -or $a.EndsWith('.' + $d))) { $r += ,$v }
    }
    return $r
}

function Leer-Config {
    $def = [pscustomobject]@{
        url = 'https://app.apartamentosbucaramanga.com/str-app-shell.html'
        perfiles = @(
            [pscustomobject]@{ rol = 'Admin de prueba (zz-verif-admin)'; nombre = ''; carpeta = '' },
            [pscustomobject]@{ rol = 'Colaborador (zz-verif-colab)';   nombre = ''; carpeta = '' },
            [pscustomobject]@{ rol = 'Operador (zz-verif-oper)';        nombre = ''; carpeta = '' }
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

# Tokens de GitHub en claves\ : se prueban con una peticion real; la cabecera de vencimiento es orientativa.
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
            if (-not $exp) { $o.texto = 'funciona (GitHub no informa la fecha de vencimiento)'; $r += $o; continue }
            $d = [DateTime]::Parse(($exp -replace ' UTC$', 'Z')).ToLocalTime()
            $o.dias = [math]::Floor(($d - (Get-Date)).TotalDays)
            $o.texto = 'funciona; vence el ' + $d.ToString('dd-MM-yyyy HH:mm') + ' (' + $o.dias + ' dias)'
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

function Leer-Json($ruta) {
    if (-not (Test-Path $ruta)) { return $null }
    try { return (Get-Content -Path $ruta -Raw -Encoding UTF8 | ConvertFrom-Json) } catch { return $null }
}

function Minutos-Desde($ruta) {
    try { return [int][math]::Floor(((Get-Date) - (Get-Item $ruta).LastWriteTime).TotalMinutes) } catch { return -1 }
}

# Maquina: estado-vivo.json que escribe el despertador cada minuto (LM-2).
function Texto-Maquina {
    $s = New-Object System.Text.StringBuilder
    $ruta = Join-Path $Buzon 'estado-vivo.json'
    $e = Leer-Json $ruta
    if (-not $e) { [void]$s.AppendLine('Maquina: sin estado-vivo.json (el despertador no ha corrido o no es v10)'); return $s.ToString() }
    $hace = Minutos-Desde $ruta
    $viejo = if ($hace -gt 3) { '  <-- VIEJO: el despertador no escribe desde hace ' + $hace + ' min (tarea STR buzon?)' } else { '' }
    [void]$s.AppendLine('Maquina (despertador, ' + [string]$e.actualizadoEn + ')' + $viejo)
    $enCola = @($e.enCola); $rech = @($e.rechazados); $fall = @($e.fallidas)
    [void]$s.AppendLine('  En cola: ' + $enCola.Count + $(if ($enCola.Count) { ' (' + ($enCola -join ', ') + ')' } else { '' }))
    if ($rech.Count) { [void]$s.AppendLine('  RECHAZADOS (criticos sin cruce; borrar o corregir): ' + ($rech -join ', ')) }
    if ($fall.Count) { [void]$s.AppendLine('  ATENCION fallidas (la cola espera a Desarrollo): ' + ($fall -join ', ')) }
    if ($e.construyendo) { [void]$s.AppendLine('  Construyendo: lote ' + [string]$e.construyendo.lote + ' desde ' + [string]$e.construyendo.desde + ' (' + [string]$e.construyendo.logHace + ' min sin log)') }
    else { [void]$s.AppendLine('  Construyendo: nada') }
    if ($e.verificando) {
        $v = $e.verificando
        $ent = if ($v.entregado) { 'ENTREGADO' } else { 'esperando ' + [string]$v.archivoEsperado }
        $pv = if ($v.preVuelo) { 'pre-vuelo ' + [string]$v.preVuelo } else { 'SIN pre-vuelo' }
        [void]$s.AppendLine('  Verificando: lote ' + [string]$v.lote + ' desde ' + [string]$v.desde + ' - ' + $ent + ' - ' + $pv)
    } else { [void]$s.AppendLine('  Verificando: nada') }
    return $s.ToString()
}

# Pre-vuelo: log\pre-vuelo.json que escribe el Chat Desarrollo antes de lanzar al verificador (LM-1).
function Texto-PreVuelo {
    $s = New-Object System.Text.StringBuilder
    $ruta = Join-Path $LogDir 'pre-vuelo.json'
    $p = Leer-Json $ruta
    if (-not $p) { [void]$s.AppendLine('Pre-vuelo: ninguno todavia'); return $s.ToString() }
    $hace = Minutos-Desde $ruta
    $val = if ($p.valido) { 'VALIDO' } else { 'NO VALIDO' + $(if ($p.motivo) { ' (' + [string]$p.motivo + ')' } else { '' }) }
    $vig = if ($hace -gt 10) { ', caducado (' + $hace + ' min)' } else { ', vigente (' + $hace + ' min)' }
    [void]$s.AppendLine('Pre-vuelo: lote ' + [string]$p.lote + ' ' + [string]$p.hora + ' - ' + $val + $vig)
    foreach ($pf in @($p.perfiles)) {
        $ok = if ($pf.ok) { 'ok' } else { 'FALLA' }
        [void]$s.AppendLine('  ' + [string]$pf.rol + ': usuario en la barra "' + [string]$pf.usuarioBarra + '" - ' + $ok)
    }
    return $s.ToString()
}

function Texto-Estado {
    $cfg = Leer-Config
    $s = New-Object System.Text.StringBuilder
    if (Test-Path $Pausa) { [void]$s.AppendLine('Jornada: EN PAUSA desde ' + (Get-Item $Pausa).LastWriteTime.ToString('dd-MM HH:mm')) }
    else { [void]$s.AppendLine('Jornada: ACTIVA (cola y despertador trabajando)') }
    # Lo que espera de Carlos: mensajes 'pendiente' para Carlos en la copia del buzon del despertador.
    try {
        $mj = Join-Path $Buzon 'cache\mensajes.json'
        if (Test-Path $mj) {
            $pc = @(((Get-Content -Path $mj -Raw -Encoding UTF8 | ConvertFrom-Json).mensajes) | Where-Object { ([string]$_.para) -eq 'Carlos' -and ([string]$_.estado) -eq 'pendiente' })
            if ($pc.Count -gt 0) {
                [void]$s.AppendLine('')
                [void]$s.AppendLine('ESPERAN DE TI (' + $pc.Count + '):')
                foreach ($m in $pc) { [void]$s.AppendLine('  ' + [string]$m.id + ' ' + [string]$m.hora + ' de ' + [string]$m.de + ': ' + [string]$m.asunto); [void]$s.AppendLine('      ' + [string]$m.texto) }
            }
        }
    } catch { }
    [void]$s.AppendLine('')
    [void]$s.Append((Texto-Maquina))
    [void]$s.Append((Texto-PreVuelo))
    [void]$s.AppendLine('Ultimo lote: ' + (Ultima-Linea (Join-Path $LogDir '_resumen.txt')))
    [void]$s.AppendLine('Despertador, ultimo aviso: ' + (Ultima-Linea (Join-Path $Buzon 'buzon.log')))
    [void]$s.AppendLine('')
    [void]$s.AppendLine('Tokens de GitHub:')
    foreach ($t in (Estado-Tokens)) { [void]$s.AppendLine('  ' + $t.chat + ': ' + $t.texto + $(if ($t.dias -ne $null -and $t.dias -le 7) { '  <-- RENOVAR' } else { '' })) }
    [void]$s.AppendLine('')
    [void]$s.AppendLine('Perfiles de Chrome de prueba (ventanas abiertas):')
    $faltan = $false
    foreach ($p in $cfg.perfiles) {
        $dir = Carpeta-Perfil $p
        if (-not $dir) { $txt = 'no encontrado (revisa panel-config.json)'; $faltan = $true }
        else {
            $vs = @(Ventanas-DePerfil $dir)
            $txt = if ($vs.Count) { 'abierto (' + $vs.Count + ' ventana' + $(if ($vs.Count -ne 1) { 's' }) + ')' } else { 'cerrado' }
        }
        [void]$s.AppendLine('  ' + $p.rol + ' [' + [string]$dir + ']: ' + $txt)
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
    $abiertos = @()
    if (-not $chrome) { $avisos += 'No encontre Chrome instalado.' }
    else {
        $lanzados = @()
        foreach ($p in $cfg.perfiles) {
            $dir = Carpeta-Perfil $p
            if (-not $dir) { $avisos += ('No encontre el perfil de ' + $p.rol + ' (' + $p.nombre + ').'); continue }
            if ((Ventanas-DePerfil $dir).Count -eq 0) {
                Start-Process -FilePath $chrome -ArgumentList @("--profile-directory=`"$dir`"", $cfg.url)
                $lanzados += $dir
                Start-Sleep -Milliseconds 800
            }
        }
        if ($lanzados.Count) { Start-Sleep -Seconds 4 }
        foreach ($p in $cfg.perfiles) {
            $dir = Carpeta-Perfil $p
            if (-not $dir) { continue }
            if ((Ventanas-DePerfil $dir).Count -gt 0) { $abiertos += $p.rol } else { $avisos += ('El perfil ' + $p.rol + ' no muestra ventana todavia: pulsa Estado en unos segundos.') }
        }
    }
    $msg = "Jornada ACTIVA.`r`nPerfiles de prueba con ventana: " + $(if ($abiertos.Count) { $abiertos -join ', ' } else { 'ninguno' }) + "`r`nSi alguno pide iniciar sesion, entra con el usuario de ese perfil:`r`n  Administrador: zz-verif-admin`r`n  Colaborador: zz-verif-colab`r`n  Operador: zz-verif-oper`r`nEl usuario de la barra lo comprueba el pre-vuelo del Chat Desarrollo antes de cada verificacion (ver Estado)."
    $avisos += (Avisos-Tokens)
    if ($avisos.Count) { $msg += "`r`n`r`n" + ($avisos -join "`r`n") }
    return $msg
}

function Terminar {
    Set-Content -Path $Pausa -Value ('Pausa pedida desde el panel: ' + (Get-Date).ToString('yyyy-MM-dd HH:mm'))
    $cfg = Leer-Config
    $cerradas = 0; $detalle = @(); $sinCarpeta = @()
    foreach ($p in $cfg.perfiles) {
        $dir = Carpeta-Perfil $p
        if (-not $dir) { $sinCarpeta += $p.rol; continue }
        if ((Norm $dir) -eq 'default') { $detalle += ('  ' + $p.rol + ': es el perfil Default; el panel no lo cierra'); continue }
        $vs = @(Ventanas-DePerfil $dir)
        foreach ($v in $vs) { try { [VentanasChrome]::Cerrar([long]$v[0]); $cerradas++ } catch { } }
        $detalle += ('  ' + $p.rol + ' [' + $dir + ']: ' + $vs.Count + ' ventana(s) cerrada(s)')
    }
    if ($cerradas) { Start-Sleep -Seconds 2 }
    $quedan = @()
    foreach ($p in $cfg.perfiles) { $dir = Carpeta-Perfil $p; if ($dir -and (Norm $dir) -ne 'default' -and (Ventanas-DePerfil $dir).Count -gt 0) { $quedan += $p.rol } }
    $msg = "Jornada EN PAUSA.`r`nLa cola no empieza lotes y el despertador no avisa a los chats."
    $lock = Join-Path $Cola '.corriendo'
    if (Test-Path $lock) { $msg += "`r`nHay un lote construyendose: termina solo y no empieza otro." }
    $msg += "`r`n`r`nPerfiles de prueba:`r`n" + ($detalle -join "`r`n")
    if ($sinCarpeta.Count) { $msg += "`r`n  No encontre: " + ($sinCarpeta -join ', ') + ' (revisa panel-config.json)' }
    if ($quedan.Count) { $msg += "`r`n  Siguen con ventana (cierralos a mano): " + ($quedan -join ', ') }
    if ($cerradas -eq 0 -and $quedan.Count -eq 0 -and $sinCarpeta.Count -eq 0) { $msg += "`r`n  (no habia ventanas de prueba abiertas)" }
    $msg += "`r`nTu perfil personal no se toca."
    return $msg
}

# --- Ventana ---
$f = New-Object System.Windows.Forms.Form
$f.Text = 'Panel STR v3'
$f.Size = New-Object System.Drawing.Size(600, 520)
$f.StartPosition = 'CenterScreen'
$f.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$b1 = New-Object System.Windows.Forms.Button
$b1.Text = 'Empezar jornada'; $b1.Size = New-Object System.Drawing.Size(175, 44); $b1.Location = New-Object System.Drawing.Point(12, 12)
$b1.BackColor = [System.Drawing.Color]::FromArgb(220, 245, 225)

$b2 = New-Object System.Windows.Forms.Button
$b2.Text = 'Terminar jornada'; $b2.Size = New-Object System.Drawing.Size(175, 44); $b2.Location = New-Object System.Drawing.Point(197, 12)
$b2.BackColor = [System.Drawing.Color]::FromArgb(250, 230, 220)

$b3 = New-Object System.Windows.Forms.Button
$b3.Text = 'Estado'; $b3.Size = New-Object System.Drawing.Size(175, 44); $b3.Location = New-Object System.Drawing.Point(382, 12)

$t = New-Object System.Windows.Forms.TextBox
$t.Multiline = $true; $t.ReadOnly = $true; $t.ScrollBars = 'Vertical'
$t.Location = New-Object System.Drawing.Point(12, 68); $t.Size = New-Object System.Drawing.Size(555, 395)
$t.Font = New-Object System.Drawing.Font('Consolas', 9.5)

$b1.Add_Click({ $t.Text = (Empezar) + "`r`n`r`n" + (Texto-Estado) })
$b2.Add_Click({ $t.Text = (Terminar) + "`r`n`r`n" + (Texto-Estado) })
$b3.Add_Click({ $t.Text = Texto-Estado })

$f.Controls.AddRange(@($b1, $b2, $b3, $t))
$f.Add_Shown({ $t.Text = Texto-Estado })
[void]$f.ShowDialog()
