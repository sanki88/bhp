param(
  [ValidatePattern('^[a-zA-Z0-9.-]+$')][string]$Server = '185.193.113.216',
  [ValidatePattern('^[a-zA-Z0-9._-]+$')][string]$Login = 'root'
)
$ErrorActionPreference = 'Stop'
Write-Host 'BHP: http://localhost:8080 | Administrator: /admin | Ochrona: /ochrona'
Write-Host 'Podaj haslo SSH w terminalu. Pozostaw okno otwarte; Ctrl+C zamyka tunel.'
& ssh -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -N -L 127.0.0.1:8080:127.0.0.1:8080 "${Login}@${Server}"
if ($LASTEXITCODE -ne 0) { throw 'Tunel SSH zostal zamkniety z bledem. Sprawdz logowanie i czy port 8080 jest wolny.' }
