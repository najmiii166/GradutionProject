<#
PowerShell deploy helper
Usage:
  .\scripts\deploy.ps1 -CommitMessage "Your commit message"
This will stage the important frontend/backend files we edited, commit, and push the current branch.
#>
param(
  [string]$CommitMessage = 'Deploy: proxy /api and /socket.io; socket client fix; CORS logging'
)

Write-Host "Checking for git..."
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git is not installed or not on PATH"
  exit 1
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "Current branch: $branch"

$files = @(
  'frontend/vercel.json',
  'frontend/src/socket.js',
  'frontend/src/api/axios.js',
  'server/src/server.js',
  'server/.env'
)

Write-Host "Staging files:" $files -ForegroundColor Cyan
git add @files

Write-Host "Git status (changes staged):"
git status --porcelain

$ans = Read-Host "Proceed to commit and push to 'origin/$branch'? (y/N)"
if ($ans.ToLower() -ne 'y') {
  Write-Host "Aborted by user"
  exit 0
}

Write-Host "Committing..."
git commit -m "$CommitMessage"

Write-Host "Pushing to origin/$branch..."
git push origin $branch

Write-Host "Done. If Vercel/Railway are connected to this repo/branch, deploys should start."