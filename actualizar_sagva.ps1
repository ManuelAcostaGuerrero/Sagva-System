param([switch]$Estado)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath($PSScriptRoot)
Set-Location -LiteralPath $root
$local=Join-Path $root '.local'
New-Item -ItemType Directory -Force -Path $local | Out-Null
$mutex=New-Object Threading.Mutex($false,'Local\SagvaSystemUpdate')
$locked=$false;$transcript=$false;$stopped=$false;$stage=$null;$resume=$false
$statePath=Join-Path $local 'update-state.json'
function Run([string]$Command,[string[]]$Arguments){ & $Command @Arguments; if($LASTEXITCODE -ne 0){throw "$Command fallo (codigo $LASTEXITCODE)."} }
function Git([string[]]$Arguments){$out=@(& git.exe @Arguments);if($LASTEXITCODE -ne 0){throw 'No se pudo verificar Git.'};return ($out -join "`n").Trim()}
function Hash([string]$File){$s=[IO.File]::OpenRead($File);$h=[Security.Cryptography.SHA256]::Create();try{return ([BitConverter]::ToString($h.ComputeHash($s))).Replace('-','')}finally{$h.Dispose();$s.Dispose()}}
function Own { @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {$_.CommandLine -and $_.CommandLine.Contains($root+'\node_modules\') -and $_.CommandLine.Contains('next')}) }
function StopOwn { foreach($entry in @(Own)){$p=Get-CimInstance Win32_Process -Filter "ProcessId=$($entry.ProcessId)";if($p -and $p.CreationDate -eq $entry.CreationDate -and $p.CommandLine.Contains($root+'\node_modules\') -and $p.CommandLine.Contains('next')){Write-Host "Deteniendo solo Sagva System PID $($p.ProcessId)";Stop-Process -Id $p.ProcessId -ErrorAction Stop}} }
function State { $script:state | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $statePath -Encoding UTF8 }
try{
 $locked=$mutex.WaitOne(0);if(!$locked){throw 'Otra actualización está en curso.'}
 Start-Transcript -Path (Join-Path $local ((Get-Date -Format yyyyMMdd-HHmmss)+'-actualizar.log')) | Out-Null;$transcript=$true
 Write-Host 'SAGVA SYSTEM - Actualizador local controlado'
 foreach($cmd in @('git.exe','node.exe','npm.cmd')){if(!(Get-Command $cmd -ErrorAction SilentlyContinue)){throw "Falta $cmd."}}
 if([int](& node.exe -p 'parseInt(process.versions.node)') -lt 24){throw 'El respaldo consistente requiere Node 24 o posterior.'}
 if((Git @('remote','get-url','origin')) -ne 'https://github.com/ManuelAcostaGuerrero/Sagva-System.git'){throw 'Origen no autorizado.'}
 if((Git @('branch','--show-current')) -ne 'main'){throw 'Usa main. No se cambió la rama.'}
 if((Git @('status','--porcelain','--untracked-files=all'))){throw 'Hay cambios locales; no se sobrescribieron.'}
 $own=@(Own);Write-Host "Procesos propios identificados: $($own.Count)"
 if($Estado){Write-Host ('Commit: '+(Git @('rev-parse','HEAD')));exit 0}
 if(Test-Path $statePath){$previous=Get-Content $statePath -Raw | ConvertFrom-Json;if($previous.RecoveryRequired){throw 'Recuperación pendiente: revisar respaldo y log, no borrar la marca.'}}
 Run git.exe @('fetch','origin','main:refs/remotes/origin/main')
 $before=Git @('rev-parse','HEAD');$target=Git @('rev-parse','origin/main')
 & git.exe merge-base --is-ancestor $before $target;if($LASTEXITCODE -ne 0){throw 'Main local divergente; no se forzó.'}
 $stamp=Join-Path $local 'installed.json'
 if($before -eq $target -and (Test-Path $stamp)){$installed=Get-Content $stamp -Raw | ConvertFrom-Json;if($installed.Commit -eq $target -and $installed.LockHash -eq (Hash 'package-lock.json') -and $installed.SchemaHash -eq (Hash 'prisma/schema.prisma') -and (Test-Path 'node_modules/.prisma/client/index.js')){Write-Host "Ya está actualizado: $target. Sin reinstalar ni reiniciar.";exit 0}}
 if(!(Test-Path '.env')){throw 'Falta configuración privada .env.'}
 $resume=$own.Count -gt 0
 $script:state=@{Before=$before;Target=$target;Stage='preparando';RecoveryRequired=$false;Result='en_curso';WasRunning=$resume};State
 $stage=Join-Path $local ('preparacion-'+[guid]::NewGuid().ToString('N'))
 Run git.exe @('worktree','add','--detach',$stage,$target)
 Push-Location -LiteralPath $stage
 $oldUrl=$env:DATABASE_URL
 try{
  $env:DATABASE_URL='file:./ensayo-actualizacion.db'
  Run npm.cmd @('ci','--no-audit')
  Run npm.cmd @('run','prisma:generate')
  Run node.exe @('tools/test-local-update-db.mjs')
  Run node.exe @('--input-type=module','-e',"import {DatabaseSync} from 'node:sqlite';new DatabaseSync('prisma/ensayo-actualizacion.db').close();")
  Run npm.cmd @('run','db:push')
  Run npm.cmd @('run','lint')
  Run npm.cmd @('run','typecheck')
  Run npm.cmd @('run','build')
 }finally{$env:DATABASE_URL=$oldUrl;Pop-Location}
 if((Git @('rev-parse','HEAD')) -ne $before -or (Git @('status','--porcelain'))){throw 'Cambió el proyecto durante preparación.'}
 $script:state.Stage='respaldo';$script:state.RecoveryRequired=$true;State
 $stopped=$true;StopOwn
 $backup=Join-Path $root ('backups/actualizacion_'+(Get-Date -Format yyyyMMdd-HHmmss)+'-'+[guid]::NewGuid().ToString('N').Substring(0,6))
 New-Item -ItemType Directory -Force -Path $backup | Out-Null
 $identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name
 Run icacls.exe @($backup,'/inheritance:r','/grant:r',"${identity}:(OI)(CI)F",'SYSTEM:(OI)(CI)F')
 Copy-Item -LiteralPath '.env' -Destination (Join-Path $backup '.env')
 $script:state.Backup=$backup;State
 Run node.exe @('tools/local-update-db.mjs','backup',$backup)
 $script:state.Stage='instalando';State
 Run git.exe @('merge','--ff-only',$target)
 Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
 Run npm.cmd @('ci','--offline','--no-audit')
 Run npm.cmd @('run','prisma:generate')
 Run npm.cmd @('run','db:push')
 Run node.exe @('tools/local-update-db.mjs','compare',$backup)
 Run npm.cmd @('run','build')
 @{Commit=$target;LockHash=(Hash 'package-lock.json');SchemaHash=(Hash 'prisma/schema.prisma')} | ConvertTo-Json | Set-Content $stamp -Encoding UTF8
 if($resume){
  $script:state.Stage='iniciando';State
  # Mantener la dirección IPv6 que usaba Next sin tocar servicios IPv4 ajenos.
  $scriptPath=Join-Path $root 'node_modules/next/dist/bin/next'
  $p=Start-Process node.exe -ArgumentList @(('"'+$scriptPath+'"'),'dev','--hostname','::','--port','3000') -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $local 'servidor.out.log') -RedirectStandardError (Join-Path $local 'servidor.err.log')
  $ready=$false;for($i=0;$i -lt 45;$i++){Start-Sleep -Seconds 1;try{$r=Invoke-WebRequest 'http://[::1]:3000' -UseBasicParsing -TimeoutSec 3;if($r.StatusCode -eq 200){$ready=$true;break}}catch{}}
  if(!$ready){throw 'El servidor no respondió. Revisar .local/servidor.err.log.'}
 }
 $script:state.Stage='completado';$script:state.Result='correcto';$script:state.RecoveryRequired=$false;State
 Write-Host "Actualización completada: $target. Respaldo verificado. Seed no ejecutado."
 if($resume){Write-Host 'Sistema iniciado. Conserva tu pestaña; recárgala después de guardar.'}
}catch{
 if($script:state){$script:state.Result='fallido';$script:state.RecoveryRequired=$stopped;$script:state.Error=$_.Exception.Message;State}
 Write-Host ('ERROR: '+$_.Exception.Message) -ForegroundColor Red
 if($stopped){Write-Host 'Instalación pendiente de recuperación. No restaurar a ciegas; revisar respaldo/log.'}else{Write-Host 'El sistema anterior no se detuvo.'}
 exit 1
}finally{
 if($transcript){Stop-Transcript | Out-Null};if($locked){$mutex.ReleaseMutex()};$mutex.Dispose()
}
