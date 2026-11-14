param(
  [ValidateSet('Inspect', 'Capture', 'Click')][string]$Action = 'Inspect',
  [string]$Name,
  [string]$OutputName = 'overview'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class NitmasWindow {
  [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hwnd);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out Rect rect);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdc, uint flags);
}
'@
[NitmasWindow]::SetProcessDPIAware() | Out-Null
$appProcess = Get-Process NITMAS | Where-Object MainWindowHandle -ne 0 | Select-Object -First 1
if (!$appProcess) { throw 'NITMAS window is not running.' }
$appWindow = [System.Windows.Automation.AutomationElement]::FromHandle($appProcess.MainWindowHandle)
if ($Action -eq 'Inspect') {
  $appWindow.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition) |
    ForEach-Object {
      $control = $_.Current
      if ($control.Name -and !$control.IsOffscreen -and $control.ControlType.ProgrammaticName -ne 'ControlType.Edit') {
        [PSCustomObject]@{ Name = $control.Name; Type = $control.ControlType.ProgrammaticName }
      }
    } | ConvertTo-Json -Compress
  exit
}
if ($Action -eq 'Click') {
  $condition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $Name)
  $controls = $appWindow.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition)
  $target = $controls | Where-Object { !$_.Current.IsOffscreen } | Select-Object -First 1
  if (!$target) { throw "Visible control not found: $Name" }
  $target.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
  exit
}
if ($OutputName -notmatch '^[a-z0-9-]+$') { throw 'Invalid screenshot name.' }
$captureDirectory = Join-Path $PSScriptRoot '../artifacts/nitmas-evidence'
New-Item -ItemType Directory -Path $captureDirectory -Force | Out-Null
$rect = New-Object NitmasWindow+Rect
[NitmasWindow]::GetWindowRect($appProcess.MainWindowHandle, [ref]$rect) | Out-Null
$bitmap = New-Object System.Drawing.Bitmap(($rect.Right - $rect.Left), ($rect.Bottom - $rect.Top))
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$dc = $graphics.GetHdc()
try { [NitmasWindow]::PrintWindow($appProcess.MainWindowHandle, $dc, 2) | Out-Null }
finally { $graphics.ReleaseHdc($dc) }
$outputPath = Join-Path $captureDirectory "$OutputName.png"
try { $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png) }
finally { $graphics.Dispose(); $bitmap.Dispose() }
Write-Output $outputPath
