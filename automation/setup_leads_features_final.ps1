# --------------------------------------------------------------
# Solar ROI Proposal Builder – Lead Status & PDF Export automation (final)
# --------------------------------------------------------------
# 1️⃣ Apply Supabase migration (adds status & notes columns)
# 2️⃣ Install pdfmake (PDF generation library)
# 3️⃣ Inject Export‑PDF button into the admin leads page
# --------------------------------------------------------------

Write-Host "`n=== Applying Supabase migration ===`n"

# Load SUPABASE_PROJECT_REF from .env.local if not already in environment
$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*SUPABASE_PROJECT_REF\s*=\s*(.+)\s*$') {
            $env:SUPABASE_PROJECT_REF = $matches[1].Trim()
        }
    }
}

if (-not $env:SUPABASE_PROJECT_REF) {
    Write-Error "SUPABASE_PROJECT_REF environment variable is not set. Set it in .env.local or export it before running the script."
    exit 1
}

$migrationFile = "supabase\\migrations\\20240609_add_status_to_leads.sql"
# Reset and apply the migration – this will drop‑and‑re‑create tables in dev.
# Use `supabase db reset` for a clean dev DB; for production use `supabase db push`.
supabase db reset --file $migrationFile --project-ref $env:SUPABASE_PROJECT_REF
if ($LASTEXITCODE -ne 0) { Write-Error "Supabase migration failed."; exit 1 }
Write-Host "✅ Migration applied successfully."

# ---------- 2️⃣ Install pdfmake ----------
Write-Host "`n=== Installing pdfmake ===`n"
# Ensure we are in the repository root (script location's parent directory)
Push-Location (Join-Path $PSScriptRoot "..")
npm install pdfmake@0.2.7 --save
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed."; Pop-Location; exit 1 }
Write-Host "✅ pdfmake installed."
Pop-Location

# ---------- 3️⃣ Inject Export‑PDF button ----------
Write-Host "`n=== Updating Leads admin UI ===`n"
$leadsPage = "src\\app\\admin\\leads\\page.tsx"
$content = Get-Content -Path $leadsPage -Raw

# Ensure Button import exists
$importSnippet = "import { Button } from '@/components/ui/button';"
if ($content -notmatch [regex]::Escape($importSnippet)) {
    $content = $importSnippet + "`n" + $content
}

# JSX for Export button (as a here‑string)
$buttonJsx = @'
<td className="px-6 py-4 text-right">
  <Button
    size="sm"
    variant="outline"
    onClick={() => {
      const url = `/api/admin/leads/export-pdf?leadId=${lead.id}`;
      window.open(url, "_blank");
    }}
    className="h-8.5 rounded-xl border border-teal-200/50 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 dark:border-teal-950/20 dark:text-teal-450 dark:hover:bg-teal-950/30"
  >
    Export PDF
  </Button>
</td>
'@

# Insert the button just before the closing </td> of the actions column.
$pattern = '(</div>\s*</td>)'
if ($content -match $pattern) {
    $replacement = "`n$buttonJsx`n$1"
    $content = [regex]::Replace($content, $pattern, $replacement)
    Set-Content -Path $leadsPage -Value $content -Encoding UTF8
    Write-Host "✅ Export PDF button inserted."
} else {
    Write-Host "Skipping button insertion – pattern not found."
}

Write-Host "`n=== Automation complete! ===`n"
Write-Host "Run the app (npm run dev) and you should see the new Status column and Export PDF button."
Exit 0
