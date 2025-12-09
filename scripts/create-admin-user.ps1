# ?? Create Admin User Script

# Backend API URL
$API_URL = "https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1"

# User data
$userData = @{
    email = "maloni@outlook.com"
    password = "SIkora1976"
    name = "Rostislav Sikora"
    social = "none"
} | ConvertTo-Json

Write-Host "?? Creating user..." -ForegroundColor Cyan
Write-Host "Email: maloni@outlook.com" -ForegroundColor Yellow
Write-Host "Note: User will be created with default role" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$API_URL/auth/register" `
        -Method Post `
        -Body $userData `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host "? User created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "User Details:" -ForegroundColor Cyan
    Write-Host "ID: $($response.user.id)" -ForegroundColor White
    Write-Host "Email: $($response.user.email)" -ForegroundColor White
    Write-Host "Name: $($response.user.name)" -ForegroundColor White
    Write-Host "Role: $($response.user.role)" -ForegroundColor White
    Write-Host ""
    Write-Host "??  If you need ADMIN role, contact backend team to upgrade this user." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "?? You can now login at: https://happy-pebble-041ffdb03.3.azurestaticapps.net/login" -ForegroundColor Green
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.ErrorDetails.Message
    
    Write-Host "? Error creating user!" -ForegroundColor Red
    Write-Host "Status Code: $statusCode" -ForegroundColor Red
    
    if ($errorMessage) {
        $errorObj = $errorMessage | ConvertFrom-Json
        Write-Host "Message: $($errorObj.message)" -ForegroundColor Red
        
        if ($statusCode -eq 400 -and $errorObj.message -match "already") {
            Write-Host ""
            Write-Host "??  User already exists. You can try to login directly." -ForegroundColor Yellow
            Write-Host "Login URL: https://happy-pebble-041ffdb03.3.azurestaticapps.net/login" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
