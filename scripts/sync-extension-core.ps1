param(
    [string]$Source = "backend/extension"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$SourcePath = Resolve-Path (Join-Path $RepoRoot $Source)
$Files = @("background.js", "content-website.js")
$Targets = @(
    "backend/extension/expense-tracker-chrome-v2",
    "frontend/public/extension",
    "frontend/public/extension/expense-tracker-chrome-v2",
    "frontend/public/extension/vibetracker-chrome",
    "frontend/public/extension-chrome"
)

foreach ($file in $Files) {
    $sourceFile = Join-Path $SourcePath $file
    if (-not (Test-Path -LiteralPath $sourceFile)) {
        throw "Missing source file: $sourceFile"
    }
}

foreach ($target in $Targets) {
    $targetPath = Join-Path $RepoRoot $target
    if (-not (Test-Path -LiteralPath $targetPath)) {
        Write-Host "Skipping missing target: $target"
        continue
    }

    $resolvedTarget = Resolve-Path $targetPath
    if (-not $resolvedTarget.Path.StartsWith($RepoRoot.Path, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to copy outside repository: $resolvedTarget"
    }

    foreach ($file in $Files) {
        if (Test-Path -LiteralPath (Join-Path $resolvedTarget $file)) {
            Copy-Item -LiteralPath (Join-Path $SourcePath $file) -Destination (Join-Path $resolvedTarget $file) -Force
        }
    }

    Write-Host "Synced extension core assets to $target"
}
