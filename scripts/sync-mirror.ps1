$src = "c:\Users\JAISINGH\OneDrive\Documents\campusCue"
$dst = "E:\CampusCue\finalChatPage"

if (Test-Path $dst) {
  Write-Host "Destination $dst exists, mirroring files..."
  robocopy (Join-Path $src "src") (Join-Path $dst "src") /E /XO /NP /NFL /NDL
  robocopy (Join-Path $src "public") (Join-Path $dst "public") /E /XO /NP /NFL /NDL
  robocopy (Join-Path $src "supabase") (Join-Path $dst "supabase") /E /XO /NP /NFL /NDL
  robocopy (Join-Path $src "scripts") (Join-Path $dst "scripts") /E /XO /NP /NFL /NDL
  Copy-Item (Join-Path $src "package.json") (Join-Path $dst "package.json") -Force
  Copy-Item (Join-Path $src "netlify.toml") (Join-Path $dst "netlify.toml") -Force
  if (Test-Path (Join-Path $src ".env")) {
    Copy-Item (Join-Path $src ".env") (Join-Path $dst ".env") -Force
  }
  Write-Host "Mirror sync completed successfully!"
} else {
  Write-Host "Destination $dst does not exist or drive not mounted."
}
