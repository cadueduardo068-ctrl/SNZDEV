param([string]$BaseUrl='http://127.0.0.1:5173')
$ErrorActionPreference='Stop'
$origin=$BaseUrl.TrimEnd('/')
if(([uri]$origin).Host -notin @('127.0.0.1','localhost')){throw 'Execute apenas no banco local de testes.'}
$session=New-Object Microsoft.PowerShell.Commands.WebRequestSession
$checks=[System.Collections.Generic.List[object]]::new()
function Check($name,$actual,$expected){if($actual -ne $expected){throw "$name expected $expected, received $actual"};$checks.Add(@{test=$name;result='PASS'})}
function Post($body,$headers=@{Origin=$origin}){Invoke-WebRequest ($origin+'/api/admin') -Method Post -WebSession $session -Headers $headers -ContentType 'application/json' -Body ($body|ConvertTo-Json -Depth 6) -SkipHttpErrorCheck}
$r=Invoke-WebRequest ($origin+'/api/admin') -SkipHttpErrorCheck;Check 'anonymous read denied' $r.StatusCode 403
$r=Invoke-WebRequest ($origin+'/api/upload') -Method Post -Body 'test' -SkipHttpErrorCheck;Check 'anonymous upload denied' $r.StatusCode 403
Invoke-WebRequest ($origin+'/signin-with-chatgpt?return_to=/admin') -WebSession $session -SkipHttpErrorCheck | Out-Null
$r=Post @{action='import'};Check 'authenticated import' $r.StatusCode 200
$r=Invoke-WebRequest ($origin+'/api/admin') -WebSession $session; $initial=($r.Content|ConvertFrom-Json).projects.Count
$r=Post @{action='import'};Check 'repeat import' $r.StatusCode 200
$r=Invoke-WebRequest ($origin+'/api/admin') -WebSession $session;Check 'import preserves existing records' (($r.Content|ConvertFrom-Json).projects.Count) $initial
$before=((Invoke-WebRequest ($origin+'/api/admin') -WebSession $session).Content|ConvertFrom-Json).projects | Sort-Object position
$ids=@($before.id);$reverse=@($ids);[array]::Reverse($reverse)
$r=Post @{action='order';ids=$reverse};Check 'atomic reorder accepted' $r.StatusCode 200
$after=((Invoke-WebRequest ($origin+'/api/admin') -WebSession $session).Content|ConvertFrom-Json).projects | Sort-Object position
Check 'order persisted' ($after[0].id) $reverse[0]
$r=Post @{action='order';ids=$ids};Check 'original order restored' $r.StatusCode 200
$project=@{id='qa-integration';name='QA integration';category='Landing pages';description='Registro temporário para teste de integração.';image='';url='';tech='React';demo=$false;featured=$false;position=999;visible=$false;nature='commercial';stage='development';features='Recurso verificado';gallery='';sourceUrl='';segment='TESTE';artDirection='Direção de arte de teste';palette='#000000,#FFFFFF'}
$r=Post @{action='save';data=$project};Check 'create project' $r.StatusCode 200
$r=Invoke-WebRequest ($origin+'/projetos/qa-integration') -SkipHttpErrorCheck;Check 'hidden project inaccessible' $r.StatusCode 404
$project.visible=$true;$project.name='QA edited';$r=Post @{action='save';data=$project};Check 'edit and publish' $r.StatusCode 200
$r=Invoke-WebRequest ($origin+'/projetos/qa-integration');Check 'published detail' $r.StatusCode 200;Check 'edited title visible' $r.Content.Contains('QA edited') $true
$r=Invoke-WebRequest $origin;Check 'published on homepage' $r.Content.Contains('QA edited') $true
$r=Post @{action='save';data=$project} @{Origin='https://evil.example'};Check 'cross-origin rejected' $r.StatusCode 403
$project.image='javascript:alert(1)';$r=Post @{action='save';data=$project};Check 'unsafe URL rejected' $r.StatusCode 400;$project.image=''
$project.stage='live';$r=Post @{action='save';data=$project};Check 'live status requires real URL' $r.StatusCode 400;$project.stage='development'
$r=Invoke-WebRequest ($origin+'/api/upload') -Method Post -WebSession $session -Headers @{Origin=$origin} -ContentType 'image/png' -Body 'not-an-image' -SkipHttpErrorCheck;Check 'forged image rejected' $r.StatusCode 400
$r=Invoke-WebRequest ($origin+'/api/upload') -Method Post -WebSession $session -Headers @{Origin=$origin} -ContentType 'image/png' -InFile 'public/og.png';Check 'valid image upload D1' $r.StatusCode 200
$url=($r.Content|ConvertFrom-Json).url;$r=Invoke-WebRequest ($origin+$url);Check 'uploaded image retrievable' $r.StatusCode 200
$r=Post @{action='delete';id='qa-integration'};Check 'delete project' $r.StatusCode 200
$r=Invoke-WebRequest ($origin+'/projetos/qa-integration') -SkipHttpErrorCheck;Check 'deleted detail inaccessible' $r.StatusCode 404
$homepageResponse=Invoke-WebRequest $origin;Check 'visitor phone input removed' ($homepageResponse.Content -match 'name="phone"') $false
$rows=((Invoke-WebRequest ($origin+'/api/admin') -WebSession $session).Content|ConvertFrom-Json).projects
Check 'eight visible concepts' @($rows|Where-Object visible).Count 8
Check 'no decorative section numbers' ($homepageResponse.Content -match '0[1-8] /') $false
foreach($p in @($rows|Where-Object visible)){
 $r=Invoke-WebRequest ($origin+'/projetos/'+$p.id)
 Check ('detail '+$p.id) $r.StatusCode 200
 Check ('concept disclaimer '+$p.id) $r.Content.Contains('Conceito visual desenvolvido para o portfólio SNZ DEV.') $true
 $encodedName=[uri]::EscapeDataString($p.name)
 Check ('personalized WhatsApp '+$p.id) $r.Content.Contains($encodedName) $true
 $r=Invoke-WebRequest ($origin+$p.image);Check ('image '+$p.id) $r.StatusCode 200
}
foreach($p in @('/projetos/velar-motors','/sitemap.xml','/robots.txt','/og.png','/media/meadow.mp4','/concepts/velar-motors.webp')){$r=Invoke-WebRequest ($origin+$p);Check ('HTTP '+$p) $r.StatusCode 200}
New-Item -ItemType Directory -Force test-results | Out-Null
$checks | ConvertTo-Json | Set-Content -LiteralPath 'test-results/integration-results.json'
Write-Output ('PASS: '+$checks.Count+' integration checks')
