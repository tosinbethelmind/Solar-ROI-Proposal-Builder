Param(
    [int]$MaxAttempts = 3,
    [int]$DelaySeconds = 5
)

# Verify network connectivity to Vercel API
$vercelHost = "api.vercel.com"
Write-Host "Checking network connectivity to $vercelHost..."
$ping = Test-NetConnection -ComputerName $vercelHost -Port 443 -InformationLevel Quiet
if (-not $ping) {
    Write-Error "Cannot reach $vercelHost. Please check your internet connection or proxy settings."
    exit 1
}

# Ensure Vercel CLI timeout is extended
$env:VERCEL_TIMEOUT = "1200"

$attempt = 1
while ($attempt -le $MaxAttempts) {
    Write-Host "Deploy attempt $attempt/$MaxAttempts..."
    # Run Vercel with production flag, skip prompts
    npx vercel --prod --yes --cwd .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Deployment succeeded."
        exit 0
    } else {
        Write-Host "Deployment failed with exit code $LASTEXITCODE."
        $attempt++
        if ($attempt -le $MaxAttempts) {
            Write-Host "Retrying in $DelaySeconds seconds..."
            Start-Sleep -Seconds $DelaySeconds
        }
    }
}
Write-Error "All deployment attempts failed."
exit 1
