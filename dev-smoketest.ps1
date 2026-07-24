$ErrorActionPreference='Continue'
function Dump($uri, $method='GET', $body=$null){
  try{
    Write-Host "`n==> $method $uri"
    if ($body -ne $null){
      $res = Invoke-RestMethod -Uri $uri -Method $method -Body ($body | ConvertTo-Json -Depth 5) -ContentType 'application/json' -TimeoutSec 10
    } else {
      $res = Invoke-RestMethod -Uri $uri -Method $method -TimeoutSec 10
    }
    Write-Host (ConvertTo-Json $res -Depth 6)
  } catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
      $r = $_.Exception.Response
      $sr = New-Object System.IO.StreamReader($r.GetResponseStream())
      $txt = $sr.ReadToEnd()
      Write-Host "RESPONSE-BODY:"
      Write-Host $txt
    }
  }
}

Dump 'http://localhost:5000/api/hello'
Dump 'http://localhost:5000/api/categories'
Dump 'http://localhost:5000/api/admin/categories'
Dump 'http://localhost:5000/api/admin/audit'
Dump 'http://localhost:5000/api/auth/login' 'POST' @{email='noone@example.com'; password='badpass'}
