# panel-str.ps1 - Panel de jornada del STR · v4.5 (14-oct-2026, LM-31; lo mantiene el Arquitecto)
# v4.5: un solo escritorio (Carlos, 14-oct: LENOVO no aguanta el escritorio virtual); Empezar trabaja en el principal.
# v4.4: Terminar responde al instante, cierra en segundo plano las ventanas de prueba y la de app. que abrió el panel; errores a log\panel.txt.
# v4.3: la ventana nueva de Chrome se maximiza con Windows (--start-maximized no sirve si Chrome ya estaba abierto).
# v4.2: Empezar abre solo app. (hPanel queda en «Abrir sitios», para no cargar Chrome).
# v4.1: Chrome maximizado; refresco más liviano (archivos cada 30 s, red cada 5 min, nada si la ventana está minimizada).
# Un clic al encender LENOVO: Empezar quita la pausa, revisa la salud de los sitios,
# comprueba las sesiones de los perfiles de prueba de pw, abre Claude Desktop y tu Chrome con app. y hPanel.
# Terminar pone la pausa y cierra las ventanas de los perfiles de prueba (las de abrir-perfil.js; nunca tu Chrome).
# Terminar y apagar: lo mismo, espera a que la cola termine lo que esta corriendo y apaga en 60 s (cancelable).
# No inicia sesion en ningun sitio, no guarda contrasenas, no lee secretos y no usa Claude (cero creditos).
# Interfaz WPF (viene con Windows). Respaldo de la version anterior: panel-str.v3.ps1.
param([switch]$Empezar)

Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Cola    = Join-Path $HOME 'Downloads\str-instr-cola'
$Pausa   = Join-Path $Cola 'PAUSA'
$Lock    = Join-Path $Cola '.corriendo'
$LogDir  = Join-Path $Cola 'log'
$Buzon   = Join-Path $Cola 'buzon'
$Pw      = Join-Path $Cola 'pw'
$Correr  = Join-Path $Cola 'correr'
$Claves  = Join-Path $Cola 'claves'
$Aqui    = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script  = $MyInvocation.MyCommand.Path

# --- Configuracion (panel-config.json es opcional; estos son los valores por defecto) ---
$Cfg = [ordered]@{
    app            = 'https://app.apartamentosbucaramanga.com'
    pruebas        = 'https://pruebas.apartamentosbucaramanga.com'
    fabrica        = 'https://fabrica.apartamentosbucaramanga.com'
    hpanel         = 'https://hpanel.hostinger.com/websites'
    perfilPersonal = 'Default'
}
try {
    $j = Get-Content -Path (Join-Path $Aqui 'panel-config.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($j.v4) { foreach ($k in @($Cfg.Keys)) { if ($j.v4.$k) { $Cfg[$k] = [string]$j.v4.$k } } }
} catch { }
$Perfiles = [ordered]@{ admin = 'Admin'; oper = 'Operador'; colab = 'Colaborador' }

# --- Tema de Windows (claro u oscuro) ---
$claro = $false
try { $claro = ((Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize' -ErrorAction Stop).AppsUseLightTheme -eq 1) } catch { }
if ($claro) {
    $T = @{ FONDO='#F4F5F7'; TARJETA='#FFFFFF'; BORDE='#DDE1E7'; TEXTO='#1B1F24'; SUAVE='#5F6B7A'; SEC='#E4E7EC'; SECTXT='#1B1F24'; PELIGRO='#FBE3E1'; PELTXT='#B3261E'; ACC='#FFFFFF' }
} else {
    $T = @{ FONDO='#16181D'; TARJETA='#1F232B'; BORDE='#2C313B'; TEXTO='#E8EAED'; SUAVE='#9AA3B2'; SEC='#3A404C'; SECTXT='#FFFFFF'; PELIGRO='#4A2A2A'; PELTXT='#FFB4AB'; ACC='#1F232B' }
}
$VERDE = '#3ECF8E'; $AMBAR = '#F5B84A'; $ROJO = '#F2685C'; $GRIS = '#8A93A3'; $AZUL = '#4C8DFF'

$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Panel STR" Width="440" SizeToContent="Height" ResizeMode="CanMinimize"
        Background="{FONDO}" FontFamily="Segoe UI Variable Text, Segoe UI" Foreground="{TEXTO}" WindowStartupLocation="Manual">
  <Window.Resources>
    <Style TargetType="Button">
      <Setter Property="Foreground" Value="#FFFFFF"/>
      <Setter Property="FontWeight" Value="SemiBold"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="Button">
            <Border x:Name="b" Background="{TemplateBinding Background}" BorderBrush="{TemplateBinding BorderBrush}" BorderThickness="{TemplateBinding BorderThickness}" CornerRadius="10" Padding="{TemplateBinding Padding}">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True"><Setter TargetName="b" Property="Opacity" Value="0.88"/></Trigger>
              <Trigger Property="IsEnabled" Value="False"><Setter TargetName="b" Property="Opacity" Value="0.45"/></Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>
    <Style x:Key="Tarjeta" TargetType="Border">
      <Setter Property="Background" Value="{TARJETA}"/>
      <Setter Property="BorderBrush" Value="{BORDE}"/>
      <Setter Property="BorderThickness" Value="1"/>
      <Setter Property="CornerRadius" Value="12"/>
      <Setter Property="Padding" Value="14,10"/>
      <Setter Property="Margin" Value="0,12,0,0"/>
    </Style>
    <Style x:Key="Titulo" TargetType="TextBlock">
      <Setter Property="FontSize" Value="11"/>
      <Setter Property="FontWeight" Value="SemiBold"/>
      <Setter Property="Foreground" Value="{SUAVE}"/>
      <Setter Property="Margin" Value="0,0,0,4"/>
    </Style>
    <Style x:Key="Dato" TargetType="TextBlock">
      <Setter Property="FontSize" Value="13"/>
      <Setter Property="Foreground" Value="{SUAVE}"/>
      <Setter Property="VerticalAlignment" Value="Center"/>
      <Setter Property="HorizontalAlignment" Value="Right"/>
      <Setter Property="TextTrimming" Value="CharacterEllipsis"/>
    </Style>
    <Style x:Key="Nombre" TargetType="TextBlock">
      <Setter Property="FontSize" Value="14"/>
      <Setter Property="VerticalAlignment" Value="Center"/>
    </Style>
    <Style TargetType="Ellipse">
      <Setter Property="Width" Value="10"/>
      <Setter Property="Height" Value="10"/>
      <Setter Property="Margin" Value="0,0,10,0"/>
      <Setter Property="VerticalAlignment" Value="Center"/>
      <Setter Property="Fill" Value="#8A93A3"/>
    </Style>
  </Window.Resources>
  <StackPanel>
    <Grid Margin="18,14,18,12">
      <TextBlock Text="Panel STR" FontSize="18" FontWeight="SemiBold" VerticalAlignment="Center"/>
      <Border x:Name="Chip" HorizontalAlignment="Right" CornerRadius="999" Padding="10,4" Background="#203ECF8E">
        <TextBlock x:Name="TxtJornada" Text="..." FontSize="12" FontWeight="SemiBold" Foreground="#3ECF8E"/>
      </Border>
    </Grid>
    <Border Height="1" Background="{BORDE}"/>
    <StackPanel Margin="18,16,18,18">
      <Button x:Name="BtnEmpezar" Content="Empezar" FontSize="17" Padding="16" Background="#4C8DFF"/>
      <Grid Margin="0,10,0,0">
        <Grid.ColumnDefinitions><ColumnDefinition/><ColumnDefinition Width="10"/><ColumnDefinition/></Grid.ColumnDefinitions>
        <Button x:Name="BtnTerminar" Grid.Column="0" Content="Terminar" FontSize="15" Padding="14" Background="{SEC}" Foreground="{SECTXT}"/>
        <Button x:Name="BtnApagar" Grid.Column="2" Content="Terminar y apagar" FontSize="15" Padding="14" Background="{PELIGRO}" Foreground="{PELTXT}"/>
      </Grid>
      <Button x:Name="BtnCancelarApagado" Content="Cancelar apagado" FontSize="15" Padding="12" Margin="0,10,0,0" Background="#F2685C" Visibility="Collapsed"/>

      <Border Style="{StaticResource Tarjeta}">
        <StackPanel>
          <TextBlock Text="SALUD" Style="{StaticResource Titulo}"/>
          <DockPanel Margin="0,5"><Ellipse x:Name="DotApp"/><TextBlock Text="app. · producción" Style="{StaticResource Nombre}"/><TextBlock x:Name="TxtApp" Text="..." Style="{StaticResource Dato}"/></DockPanel>
          <DockPanel Margin="0,5"><Ellipse x:Name="DotPruebas"/><TextBlock Text="pruebas." Style="{StaticResource Nombre}"/><TextBlock x:Name="TxtPruebas" Text="..." Style="{StaticResource Dato}"/></DockPanel>
          <DockPanel Margin="0,5"><Ellipse x:Name="DotFabrica"/><TextBlock Text="fabrica. · modelo" Style="{StaticResource Nombre}"/><TextBlock x:Name="TxtFabrica" Text="..." Style="{StaticResource Dato}"/></DockPanel>
        </StackPanel>
      </Border>

      <Border Style="{StaticResource Tarjeta}">
        <StackPanel>
          <DockPanel>
            <Button x:Name="BtnSesiones" DockPanel.Dock="Right" Content="Comprobar" FontSize="12" Padding="10,4" Background="{SEC}" Foreground="{SECTXT}"/>
            <TextBlock Text="PERFILES DE PRUEBA" Style="{StaticResource Titulo}" VerticalAlignment="Center"/>
          </DockPanel>
          <DockPanel Margin="0,5"><Ellipse x:Name="DotAdmin"/><Button x:Name="BtnAdmin" DockPanel.Dock="Right" Content="Volver a entrar" FontSize="12" Padding="10,5" Background="#29F5B84A" Foreground="#F5B84A" Visibility="Collapsed"/><TextBlock Text="Admin" Style="{StaticResource Nombre}"/><TextBlock x:Name="TxtAdmin" Text="..." Style="{StaticResource Dato}" Margin="0,0,8,0"/></DockPanel>
          <DockPanel Margin="0,5"><Ellipse x:Name="DotOper"/><Button x:Name="BtnOper" DockPanel.Dock="Right" Content="Volver a entrar" FontSize="12" Padding="10,5" Background="#29F5B84A" Foreground="#F5B84A" Visibility="Collapsed"/><TextBlock Text="Operador" Style="{StaticResource Nombre}"/><TextBlock x:Name="TxtOper" Text="..." Style="{StaticResource Dato}" Margin="0,0,8,0"/></DockPanel>
          <DockPanel Margin="0,5"><Ellipse x:Name="DotColab"/><Button x:Name="BtnColab" DockPanel.Dock="Right" Content="Volver a entrar" FontSize="12" Padding="10,5" Background="#29F5B84A" Foreground="#F5B84A" Visibility="Collapsed"/><TextBlock Text="Colaborador" Style="{StaticResource Nombre}"/><TextBlock x:Name="TxtColab" Text="..." Style="{StaticResource Dato}" Margin="0,0,8,0"/></DockPanel>
        </StackPanel>
      </Border>

      <Border Style="{StaticResource Tarjeta}">
        <StackPanel>
          <TextBlock Text="TRABAJO" Style="{StaticResource Titulo}"/>
          <DockPanel Margin="0,5"><Ellipse x:Name="DotCola"/><TextBlock Text="Cola" Style="{StaticResource Nombre}"/><TextBlock x:Name="TxtCola" Text="..." Style="{StaticResource Dato}"/></DockPanel>
          <DockPanel Margin="0,5"><Ellipse x:Name="DotLote"/><TextBlock x:Name="TxtLoteNombre" Text="Último lote" Style="{StaticResource Nombre}"/><TextBlock x:Name="TxtLote" Text="..." Style="{StaticResource Dato}"/></DockPanel>
          <DockPanel Margin="0,5"><Ellipse x:Name="DotEspera"/><TextBlock Text="Espera por ti" Style="{StaticResource Nombre}"/><TextBlock x:Name="TxtEspera" Text="..." Style="{StaticResource Dato}"/></DockPanel>
        </StackPanel>
      </Border>

      <Grid Margin="0,14,0,0">
        <Grid.ColumnDefinitions><ColumnDefinition/><ColumnDefinition Width="8"/><ColumnDefinition/><ColumnDefinition Width="8"/><ColumnDefinition/></Grid.ColumnDefinitions>
        <Button x:Name="BtnClaude" Grid.Column="0" Content="Abrir Claude" FontSize="13" Padding="10" Background="{ACC}" Foreground="{TEXTO}" BorderBrush="{BORDE}" BorderThickness="1"/>
        <Button x:Name="BtnSitios" Grid.Column="2" Content="Abrir sitios" FontSize="13" Padding="10" Background="{ACC}" Foreground="{TEXTO}" BorderBrush="{BORDE}" BorderThickness="1"/>
        <Button x:Name="BtnEstado" Grid.Column="4" Content="Estado ↻" FontSize="13" Padding="10" Background="{ACC}" Foreground="{TEXTO}" BorderBrush="{BORDE}" BorderThickness="1"/>
      </Grid>
      <TextBlock x:Name="TxtMensaje" Text="" TextWrapping="Wrap" FontSize="13" Margin="0,12,0,0"/>
      <DockPanel Margin="0,10,0,0">
        <CheckBox x:Name="ChkInicio" Content="Abrir al encender" Foreground="{SUAVE}" FontSize="12" VerticalAlignment="Center"/>
        <TextBlock x:Name="TxtPie" Text="" FontSize="11" Foreground="{SUAVE}" HorizontalAlignment="Right" VerticalAlignment="Center" TextWrapping="Wrap"/>
      </DockPanel>
    </StackPanel>
  </StackPanel>
</Window>
'@
foreach ($k in $T.Keys) { $xaml = $xaml.Replace('{' + $k + '}', $T[$k]) }
$win = [Windows.Markup.XamlReader]::Parse($xaml)
function C($n) { return $win.FindName($n) }
$bc = New-Object System.Windows.Media.BrushConverter
function Pintar($punto, [string]$color) { (C $punto).Fill = $bc.ConvertFromString($color) }
function Escribir($nombre, [string]$texto) { (C $nombre).Text = $texto }
function Mensaje([string]$t) { Escribir 'TxtMensaje' $t }
# Registro corto del panel (log\panel.txt): acciones y errores, para poder revisar qué pasó
function Anotar([string]$t) { try { Add-Content -Path (Join-Path $LogDir 'panel.txt') -Value ((Get-Date).ToString('s') + ' ' + $t) -Encoding UTF8 } catch { } }
# Corre una acción de botón: si falla, lo dice en el panel y lo anota (antes el error no se veía)
function Seguro([string]$nombre, [scriptblock]$accion) {
    Anotar $nombre
    try { & $accion } catch { Mensaje ('No se pudo completar «' + $nombre + '»: ' + $_.Exception.Message); Anotar ('ERROR ' + $nombre + ': ' + $_.Exception.Message) }
}

# Ventana a la derecha de la pantalla
$wa = [System.Windows.SystemParameters]::WorkArea
$win.Left = $wa.Right - 440 - 24; $win.Top = $wa.Top + 24

# --- Trabajo en segundo plano (la ventana no se congela mientras se consulta la red) ---
$script:Trabajos = New-Object System.Collections.ArrayList
function En-Fondo([scriptblock]$trabajo, $arg, [scriptblock]$alTerminar) {
    $ps = [powershell]::Create()
    [void]$ps.AddScript($trabajo.ToString())
    if ($null -ne $arg) { [void]$ps.AddArgument($arg) }
    $h = $ps.BeginInvoke()
    [void]$script:Trabajos.Add(@{ ps = $ps; h = $h; fin = $alTerminar })
}
$sbSalud = {
    param($u)
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $r = @{}
    foreach ($k in @('app', 'pruebas', 'fabrica')) {
        try { $r[$k] = @{ ok = $true; j = (Invoke-RestMethod -Uri $u[$k] -TimeoutSec 10 -UseBasicParsing) } }
        catch { $r[$k] = @{ ok = $false; err = [string]$_.Exception.Message } }
    }
    return $r
}
$sbTokens = {
    param($claves)
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $avisos = @()
    foreach ($par in @(@('Desarrollo', 'desarrollo.txt'), @('Diseno', 'diseno.txt'), @('Arquitecto', 'arquitecto.txt'))) {
        $ruta = Join-Path $claves $par[1]
        if (-not (Test-Path $ruta)) { $avisos += ('token ' + $par[0] + ': sin archivo'); continue }
        $tok = ([string](Get-Content -Path $ruta -Raw -ErrorAction SilentlyContinue)).Trim()
        if (-not $tok) { $avisos += ('token ' + $par[0] + ': vacio'); continue }
        try {
            $resp = Invoke-WebRequest -Uri 'https://api.github.com/rate_limit' -UseBasicParsing -TimeoutSec 10 -Headers @{ Authorization = "Bearer $tok"; 'User-Agent' = 'panel-str' } -ErrorAction Stop
            $exp = [string]$resp.Headers['github-authentication-token-expiration']
            if ($exp) {
                $d = [DateTime]::Parse(($exp -replace ' UTC$', 'Z')).ToLocalTime()
                $dias = [math]::Floor(($d - (Get-Date)).TotalDays)
                if ($dias -le 7) { $avisos += ('token ' + $par[0] + ': vence en ' + $dias + ' dias') }
            }
        } catch { $avisos += ('token ' + $par[0] + ': NO FUNCIONA') }
    }
    return ,$avisos
}

# --- Lectura de archivos de la cola ---
function Leer-Json($ruta) {
    if (-not (Test-Path $ruta)) { return $null }
    try { return (Get-Content -Path $ruta -Raw -Encoding UTF8 | ConvertFrom-Json) } catch { return $null }
}
function Hora-De($ruta) { try { return (Get-Item $ruta).LastWriteTime } catch { return $null } }

function Pintar-Salud($r) {
    foreach ($par in @(@('app', 'DotApp', 'TxtApp'), @('pruebas', 'DotPruebas', 'TxtPruebas'), @('fabrica', 'DotFabrica', 'TxtFabrica'))) {
        $x = $r[$par[0]]
        if (-not $x -or -not $x.ok) { Pintar $par[1] $ROJO; Escribir $par[2] 'no responde'; continue }
        $j = $x.j
        if ($j.db -eq $true) {
            Pintar $par[1] $VERDE
            $t = 'base ok'
            if ($par[0] -ne 'pruebas' -and $j.schema_version) { $t += ' · esquema ' + $j.schema_version }
            if ($par[0] -eq 'fabrica') { $t = Texto-Modelo $t }
            Escribir $par[2] $t
        } else { Pintar $par[1] $AMBAR; Escribir $par[2] 'responde sin base' }
    }
}
# Ultima carga y exportacion del modelo, del resumen de la cola
function Texto-Modelo([string]$base) {
    $res = Join-Path $LogDir '_resumen.txt'
    if (-not (Test-Path $res)) { return $base }
    $lin = @(Get-Content -Path $res -Tail 400 -ErrorAction SilentlyContinue)
    $carga = $lin | Where-Object { $_ -match '\| MODELO \| paquete-' } | Select-Object -Last 1
    $exp = $lin | Where-Object { $_ -match '\| MODELO \| EXPORTAR' } | Select-Object -Last 1
    $t = @()
    if ($carga) { $t += ('cargado ' + $carga.Substring(11, 5)) }
    if ($exp) { $t += ('exportado ' + $exp.Substring(11, 5)) }
    if ($t.Count) { return ($t -join ' · ') } else { return $base }
}

function Pintar-Sesiones {
    $ruta = Join-Path $LogDir 'SESIONES-guion.json'
    $j = Leer-Json $ruta
    $hora = Hora-De $ruta
    foreach ($k in $Perfiles.Keys) {
        $nom = (Get-Culture).TextInfo.ToTitleCase($k)
        $dot = 'Dot' + $nom; $txt = 'Txt' + $nom; $btn = 'Btn' + $nom
        $caso = $null
        if ($j) { $caso = @($j.casos) | Where-Object { $_.perfil -eq $k } | Select-Object -First 1 }
        if (-not $caso) { Pintar $dot $GRIS; Escribir $txt 'sin comprobar'; (C $btn).Visibility = 'Visible' }
        elseif ($caso.ok -eq $true) { Pintar $dot $VERDE; Escribir $txt ('con sesión · ' + $hora.ToString('HH:mm')); (C $btn).Visibility = 'Collapsed' }
        else { Pintar $dot $AMBAR; Escribir $txt 'sin sesión'; (C $btn).Visibility = 'Visible' }
    }
}

function Pintar-Trabajo {
    $e = Leer-Json (Join-Path $Buzon 'estado-vivo.json')
    if (-not $e) { Pintar 'DotCola' $GRIS; Escribir 'TxtCola' 'sin datos del despertador' }
    else {
        $enCola = @($e.enCola).Count; $fall = @($e.fallidas).Count
        if ($fall) { Pintar 'DotCola' $ROJO; Escribir 'TxtCola' ($fall.ToString() + ' fallida(s): avisa a Desarrollo') }
        elseif (Test-Path $Lock) { Pintar 'DotCola' $AZUL; Escribir 'TxtCola' $(if ($e.construyendo) { 'construyendo ' + [string]$e.construyendo.lote } else { 'trabajando' }) }
        elseif ($enCola) { Pintar 'DotCola' $AMBAR; Escribir 'TxtCola' ($enCola.ToString() + ' en espera') }
        else { Pintar 'DotCola' $VERDE; Escribir 'TxtCola' 'vacía' }
        $pend = 0; try { $pend = [int]$e.metricas.esperaDueno.pendientes } catch { }
        if ($pend -gt 0) { Pintar 'DotEspera' $AMBAR; Escribir 'TxtEspera' ($pend.ToString() + ' pendiente(s)') } else { Pintar 'DotEspera' $VERDE; Escribir 'TxtEspera' 'nada' }
    }
    # Ultimo lote: el log\L-n-pruebas.json mas reciente y su veredicto del juez
    $p = Get-ChildItem -Path $LogDir -Filter 'L-*-pruebas.json' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1
    if (-not $p) { Pintar 'DotLote' $GRIS; Escribir 'TxtLote' '-'; return }
    $lote = $p.Name -replace '-pruebas\.json$', ''
    Escribir 'TxtLoteNombre' ('Último lote · ' + $lote)
    $pr = Leer-Json $p.FullName
    $v = Get-ChildItem -Path $LogDir -Filter ($lote + '-veredicto*.json') -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1
    $ver = if ($v) { Leer-Json $v.FullName } else { $null }
    $rp = if ($pr) { [string]$pr.resultado } else { '?' }
    $rv = if ($ver) { [string]$ver.resultado } else { 'sin juez' }
    Escribir 'TxtLote' ('pruebas ' + $rp + ' · juez ' + $rv)
    if ($rv -eq 'aceptado') { Pintar 'DotLote' $VERDE } elseif ($rv -eq 'no aceptado' -or $rp -eq 'rojo') { Pintar 'DotLote' $ROJO } else { Pintar 'DotLote' $AMBAR }
}

function Pintar-Jornada {
    if (Test-Path $Pausa) {
        Escribir 'TxtJornada' '● En pausa'; (C 'TxtJornada').Foreground = $bc.ConvertFromString($AMBAR); (C 'Chip').Background = $bc.ConvertFromString('#29F5B84A')
    } else {
        Escribir 'TxtJornada' '● Jornada activa'; (C 'TxtJornada').Foreground = $bc.ConvertFromString($VERDE); (C 'Chip').Background = $bc.ConvertFromString('#203ECF8E')
    }
}

function Refrescar([switch]$ConRed) {
    Pintar-Jornada; Pintar-Sesiones; Pintar-Trabajo
    if ($ConRed) {
        En-Fondo $sbSalud @{ app = $Cfg.app + '/api/health'; pruebas = $Cfg.pruebas + '/api/health'; fabrica = $Cfg.fabrica + '/modelo/api/salud' } { param($r) Pintar-Salud $r }
        En-Fondo $sbTokens $Claves { param($a) $script:AvisosTokens = @($a); Pintar-Pie }
    }
    Pintar-Pie
}
$script:AvisosTokens = @()
function Pintar-Pie {
    $t = 'Actualizado ' + (Get-Date).ToString('HH:mm')
    if ($script:AvisosTokens.Count) { $t += ' · ' + ($script:AvisosTokens -join ' · ') }
    Escribir 'TxtPie' $t
}

# --- Acciones ---
function Comprobar-Sesiones {
    if (Test-Path $Pausa) {
        # En pausa la cola no corre: el panel lanza la comprobacion el mismo (oculta, unos segundos)
        $node = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -First 1).Source
        if (-not $node) { Mensaje 'No encontré node para comprobar las sesiones.'; return }
        Start-Process -FilePath $node -ArgumentList @('guion.js', 'sesiones.spec.js', '--lote', 'SESIONES') -WorkingDirectory $Pw -WindowStyle Hidden
        Mensaje 'Comprobando sesiones (unos segundos)...'
    } else {
        # Con la jornada activa la comprueba la cola, en su turno (no choca con un lote que use los mismos perfiles)
        if (-not (Test-Path $Correr)) { New-Item -ItemType Directory -Path $Correr | Out-Null }
        Set-Content -Path (Join-Path $Correr 'sesiones.txt') -Value ('panel ' + (Get-Date).ToString('s')) -Encoding ASCII
        Mensaje 'Comprobando sesiones: la cola lo hace en su próxima vuelta (1-2 min).'
    }
}
function Volver-A-Entrar([string]$u) {
    $node = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -First 1).Source
    if (-not $node) { Mensaje 'No encontré node.'; return }
    Start-Process -FilePath $node -ArgumentList @('abrir-perfil.js', $u) -WorkingDirectory $Pw -WindowStyle Hidden
    Mensaje ('Se abrió Chrome con el perfil de prueba ' + $Perfiles[$u] + '. Entra con Google con esa cuenta, espera a ver el STR y cierra esa ventana. Luego pulsa Comprobar.')
}
function Buscar-Chrome {
    foreach ($c in @((Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'), (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'), (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe'))) {
        if ($c -and (Test-Path $c)) { return $c }
    }
    return $null
}
$script:VentanasPanel = New-Object System.Collections.ArrayList   # ventanas de Chrome que abrió este panel
function Abrir-Sitios([switch]$SoloApp) {
    $ch = Buscar-Chrome
    if (-not $ch) { Mensaje 'No encontré Chrome.'; return }
    $urls = @($Cfg.app + '/str-app-shell.html')
    if (-not $SoloApp) { $urls += $Cfg.hpanel }
    if (-not ('VentanasStr' -as [type])) { Add-Type -TypeDefinition $CsVentanas }
    $antes = [VentanasStr]::Chrome()
    Start-Process -FilePath $ch -ArgumentList (@(('--profile-directory=' + $Cfg.perfilPersonal), '--new-window', '--start-maximized') + $urls)
    # Chrome ya abierto ignora --start-maximized: se busca la ventana nueva y se maximiza (hasta 10 s, sin congelar el panel)
    $script:MaxAntes = $antes; $script:MaxVueltas = 0
    $t = New-Object System.Windows.Threading.DispatcherTimer
    $t.Interval = [TimeSpan]::FromMilliseconds(400)
    $t.Add_Tick({
        $script:MaxVueltas++
        $nuevas = @([VentanasStr]::MaximizarNuevas($script:MaxAntes))
        foreach ($h in $nuevas) { [void]$script:VentanasPanel.Add($h) }
        if ($nuevas.Count -gt 0 -or $script:MaxVueltas -ge 25) {
            if ($nuevas.Count -eq 0) { [void][VentanasStr]::MaximizarPrimerPlano() }
            $this.Stop()
        }
    })
    $t.Start()
}
# Ventanas de Chrome: lista las principales y maximiza las nuevas (API de Windows, user32)
$CsVentanas = @'
using System; using System.Collections.Generic; using System.Diagnostics; using System.Runtime.InteropServices; using System.Text;
public static class VentanasStr {
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern IntPtr GetWindow(IntPtr h, uint cmd);
  [DllImport("user32.dll")] static extern int GetWindowTextLength(IntPtr h);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool ShowWindowAsync(IntPtr h, int cmd);
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  static bool EsChrome(IntPtr h) {
    if (!IsWindowVisible(h) || GetWindow(h, 4) != IntPtr.Zero || GetWindowTextLength(h) == 0) return false;
    StringBuilder c = new StringBuilder(64); GetClassName(h, c, 64);
    if (c.ToString() != "Chrome_WidgetWin_1") return false;
    uint pid; GetWindowThreadProcessId(h, out pid);
    try { return Process.GetProcessById((int)pid).ProcessName.ToLower() == "chrome"; } catch { return false; }
  }
  public static IntPtr[] Chrome() {
    List<IntPtr> r = new List<IntPtr>();
    EnumWindows(delegate(IntPtr h, IntPtr l) { if (EsChrome(h)) r.Add(h); return true; }, IntPtr.Zero);
    return r.ToArray();
  }
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
  public static IntPtr[] MaximizarNuevas(IntPtr[] antes) {
    HashSet<IntPtr> v = new HashSet<IntPtr>(antes); List<IntPtr> r = new List<IntPtr>();
    foreach (IntPtr h in Chrome()) { if (!v.Contains(h)) { ShowWindowAsync(h, 3); SetForegroundWindow(h); r.Add(h); } }
    return r.ToArray();
  }
  // Cierra la ventana como si se pulsara la X (Chrome guarda la sesión normal)
  public static bool Cerrar(IntPtr h) { if (!IsWindow(h)) return false; return PostMessage(h, 0x0010, IntPtr.Zero, IntPtr.Zero); }
  public static bool MaximizarPrimerPlano() {
    IntPtr h = GetForegroundWindow();
    if (h == IntPtr.Zero || !EsChrome(h)) return false;
    return ShowWindowAsync(h, 3);
  }
}
'@
function Abrir-Claude {
    try {
        $a = Get-StartApps -Name 'Claude' -ErrorAction Stop | Where-Object { $_.Name -eq 'Claude' } | Select-Object -First 1
        if ($a) { Start-Process ('shell:AppsFolder\' + $a.AppID); return }
    } catch { }
    foreach ($c in @((Join-Path $env:LOCALAPPDATA 'AnthropicClaude\claude.exe'), (Join-Path $env:LOCALAPPDATA 'Programs\Claude\Claude.exe'))) {
        if (Test-Path $c) { Start-Process -FilePath $c; return }
    }
    Mensaje 'No encontré Claude Desktop instalado.'
}
# Cierra solo las ventanas de los perfiles de prueba abiertas con abrir-perfil.js (no las de Playwright ni tu Chrome).
# Corre en segundo plano (la consulta a Windows y la espera tardan unos segundos).
$sbCerrarPerfiles = {
    $n = 0
    $procs = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like '*perfiles-chrome*' -and $_.CommandLine -notlike '*--type=*' -and $_.CommandLine -notlike '*--enable-automation*' }
    foreach ($p in @($procs)) {
        try { $gp = Get-Process -Id $p.ProcessId -ErrorAction Stop; [void]$gp.CloseMainWindow(); $n++ } catch { }
    }
    Start-Sleep -Milliseconds 2500
    foreach ($p in @($procs)) { try { Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop } catch { } }
    return $n
}

function Empezar-Jornada {
    if (Test-Path $Pausa) { Remove-Item -Path $Pausa -Force }
    Refrescar -ConRed
    Comprobar-Sesiones
    Abrir-Claude
    Abrir-Sitios -SoloApp
    Mensaje 'Jornada activa: la cola y el despertador trabajan. Sesiones: la cola las comprueba en 1-2 min.'
}

$script:Apagando = $false
# Pone la pausa al instante; lo lento (cerrar ventanas) va en segundo plano y avisa al terminar
function Terminar-Jornada([string]$alFinal) {
    if (-not (Test-Path $Pausa)) { Set-Content -Path $Pausa -Value ('panel ' + (Get-Date).ToString('s')) -Encoding ASCII }
    Pintar-Jornada
    $v = 0
    if (-not ('VentanasStr' -as [type])) { Add-Type -TypeDefinition $CsVentanas }
    foreach ($h in @($script:VentanasPanel)) { if ([VentanasStr]::Cerrar($h)) { $v++ } }
    $script:VentanasPanel.Clear()
    $script:CerradasApp = $v; $script:AlFinal = $alFinal
    Mensaje 'Terminando: jornada en pausa, cerrando ventanas...'
    En-Fondo $sbCerrarPerfiles $null {
        param($n)
        if ($null -eq $n) { $n = 0 }
        Anotar ('Terminar: app ' + $script:CerradasApp + ', prueba ' + $n)
        if ($script:AlFinal) { return }   # Terminar y apagar: el mensaje lo lleva la espera del apagado
        $t = 'Listo, jornada en pausa: la cola no empieza lotes y el despertador no avisa.'
        $t += ' Cerré ' + $script:CerradasApp + ' ventana(s) del STR y ' + $n + ' de prueba. Tus otras ventanas de Chrome y Claude no se tocan.'
        Mensaje $t; Pintar-Trabajo
    }
}

# --- Botones ---
(C 'BtnEmpezar').Add_Click({ Seguro 'Empezar' { Empezar-Jornada } })
(C 'BtnTerminar').Add_Click({ Seguro 'Terminar' { Terminar-Jornada } })
(C 'BtnApagar').Add_Click({ Seguro 'Terminar y apagar' {
    Terminar-Jornada 'Jornada en pausa. Esperando a que la cola termine lo que está corriendo para apagar...'
    $script:Apagando = $true; $script:EsperaDesde = Get-Date
    (C 'BtnApagar').IsEnabled = $false; (C 'BtnEmpezar').IsEnabled = $false
    (C 'BtnCancelarApagado').Visibility = 'Visible'
    Mensaje 'Jornada en pausa. Esperando a que la cola termine lo que está corriendo para apagar...'
} })
(C 'BtnCancelarApagado').Add_Click({
    $script:Apagando = $false
    Start-Process -FilePath 'shutdown.exe' -ArgumentList '/a' -WindowStyle Hidden
    (C 'BtnCancelarApagado').Visibility = 'Collapsed'; (C 'BtnApagar').IsEnabled = $true; (C 'BtnEmpezar').IsEnabled = $true
    Mensaje 'Apagado cancelado. La jornada sigue en pausa.'
})
(C 'BtnSesiones').Add_Click({ Comprobar-Sesiones })
(C 'BtnAdmin').Add_Click({ Volver-A-Entrar 'admin' })
(C 'BtnOper').Add_Click({ Volver-A-Entrar 'oper' })
(C 'BtnColab').Add_Click({ Volver-A-Entrar 'colab' })
(C 'BtnClaude').Add_Click({ Seguro 'Abrir Claude' { Abrir-Claude } })
(C 'BtnSitios').Add_Click({ Seguro 'Abrir sitios' { Abrir-Sitios } })
(C 'BtnEstado').Add_Click({ Refrescar -ConRed; Mensaje '' })

# Abrir al encender: acceso directo en la carpeta Inicio de Windows
$Atajo = Join-Path ([Environment]::GetFolderPath('Startup')) 'Panel STR.lnk'
(C 'ChkInicio').IsChecked = (Test-Path $Atajo)
(C 'ChkInicio').Add_Click({
    if ((C 'ChkInicio').IsChecked) {
        $sh = New-Object -ComObject WScript.Shell
        $lnk = $sh.CreateShortcut($Atajo)
        $lnk.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'
        $lnk.Arguments = '"' + (Join-Path $Aqui 'lanzar-panel.vbs') + '"'
        $lnk.WorkingDirectory = $Aqui
        $lnk.Save()
        Mensaje 'Listo: el panel se abrirá solo al encender LENOVO.'
    } else {
        if (Test-Path $Atajo) { Remove-Item -Path $Atajo -Force }
        Mensaje 'El panel ya no se abrirá solo al encender.'
    }
})

# --- Reloj: resultados en segundo plano, refresco y espera del apagado ---
$script:Ticks = 0
$reloj = New-Object System.Windows.Threading.DispatcherTimer
$reloj.Interval = [TimeSpan]::FromMilliseconds(500)
$reloj.Add_Tick({
    foreach ($t in @($script:Trabajos)) {
        if ($t.h.IsCompleted) {
            $res = $null
            try { $out = $t.ps.EndInvoke($t.h); if ($out.Count) { $res = $out[0] } } catch { }
            $t.ps.Dispose(); $script:Trabajos.Remove($t)
            try { & $t.fin $res } catch { }
        }
    }
    $script:Ticks++
    $visible = ($win.WindowState -ne 'Minimized')
    if ($visible -and $script:Ticks % 60 -eq 0) { Pintar-Jornada; Pintar-Sesiones; Pintar-Trabajo }   # cada 30 s, solo archivos
    if ($visible -and $script:Ticks % 600 -eq 0) { Refrescar -ConRed }                                 # cada 5 min, tambien la red
    if ($script:Apagando) {
        $min = [int]((Get-Date) - $script:EsperaDesde).TotalMinutes
        if ((Test-Path $Lock) -and $min -lt 45) {
            Mensaje ('Esperando a que la cola termine (' + $min + ' min de 45 como máximo)...')
        } else {
            $script:Apagando = $false
            Start-Process -FilePath 'shutdown.exe' -ArgumentList @('/s', '/t', '60', '/c', 'Panel STR: LENOVO se apaga en 60 segundos.') -WindowStyle Hidden
            Mensaje 'LENOVO se apaga en 60 segundos. Pulsa Cancelar apagado si te arrepientes.'
        }
    }
})
$reloj.Start()

$win.Add_ContentRendered({
    Refrescar -ConRed
    if ($Empezar) { Empezar-Jornada }
})
[void]$win.ShowDialog()
foreach ($t in @($script:Trabajos)) { try { $t.ps.Stop(); $t.ps.Dispose() } catch { } }
