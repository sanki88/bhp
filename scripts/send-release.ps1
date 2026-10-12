param(
  [Parameter(Mandatory = $true)][string]$Login,
  [string]$Server = '185.193.113.216',
  [int]$Port = 22,
  [Parameter(Mandatory = $true)][string]$Archive
)
$ErrorActionPreference = 'Stop'
if ($Login -notmatch '^[a-zA-Z0-9._-]+$' -or $Server -notmatch '^[a-zA-Z0-9.-]+$') { throw 'Invalid SSH login/server.' }
$resolved = (Resolve-Path -LiteralPath $Archive).Path
if (-not $resolved.EndsWith('.tar.gz')) { throw 'Choose the generated .tar.gz release.' }
$target = "${Login}@${Server}"
& ssh -p $Port $target 'umask 077; mkdir -p ~/bhp/incoming'
if ($LASTEXITCODE -ne 0) { throw 'SSH connection failed.' }
& scp -P $Port $resolved "${resolved}.sha256" "${target}:bhp/incoming/"
if ($LASTEXITCODE -ne 0) { throw 'Transfer failed.' }
Write-Host 'Release transferred. Connect using ssh and follow README deployment instructions. Passwords are entered only in the SSH prompt.'
