$ErrorActionPreference='Stop'
$tokens=$null;$errors=$null;$ast=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot '../actualizar_sagva.ps1'),[ref]$tokens,[ref]$errors)
$definition=$ast.Find({param($node)$node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'StopOwn'},$true)
Invoke-Expression $definition.Extent.Text
$root='C:\fixture\Sagva-System';$created=Get-Date;$script:stops=0
function Own { [pscustomobject]@{ProcessId=27;CreationDate=$created} }
function Get-CimInstance { $script:current }
function Stop-Process { $script:stops++ }
$script:current=[pscustomobject]@{ProcessId=27;CreationDate=$created;CommandLine=$null};StopOwn
$script:current=$null;StopOwn
$script:current=[pscustomobject]@{ProcessId=27;CreationDate=$created.AddSeconds(1);CommandLine='C:\fixture\Sagva-System\node_modules\next\server.js'};StopOwn
$script:current=[pscustomobject]@{ProcessId=27;CreationDate=$created;CommandLine='C:\otro\node_modules\next\server.js'};StopOwn
if($script:stops -ne 0){throw 'Se intentó detener proceso sin identidad acreditada.'}
$script:current=[pscustomobject]@{ProcessId=27;CreationDate=$created;CommandLine='C:\fixture\Sagva-System\node_modules\next\server.js'};StopOwn
if($script:stops -ne 1){throw 'No se detuvo proceso propio simulado.'}
Write-Output '5 controles de identidad: proceso desaparecido, comando nulo, PID reutilizado, ruta ajena y proceso propio. Sin procesos reales.'
