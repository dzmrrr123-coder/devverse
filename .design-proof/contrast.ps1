# WCAG 2.x contrast for the DEVVERSE 'Meja Kerja' palette (dark).
# Evidence only: measures exactly the text/background pairs the two frames use,
# prints a markdown table for DESIGN-DIRECTION.md, and fails loudly if one is under AA.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .design-proof\contrast.ps1

function Get-Lum([string]$hex) {
    $h = $hex.TrimStart('#')
    $c = @(
        ([Convert]::ToInt32($h.Substring(0, 2), 16) / 255),
        ([Convert]::ToInt32($h.Substring(2, 2), 16) / 255),
        ([Convert]::ToInt32($h.Substring(4, 2), 16) / 255)
    )
    $lin = $c | ForEach-Object {
        if ($_ -le 0.04045) { $_ / 12.92 } else { [Math]::Pow(($_ + 0.055) / 1.055, 2.4) }
    }
    return (0.2126 * $lin[0]) + (0.7152 * $lin[1]) + (0.0722 * $lin[2])
}

function Get-Ratio([string]$fg, [string]$bg) {
    $a = Get-Lum $fg; $b = Get-Lum $bg
    $hi = [Math]::Max($a, $b); $lo = [Math]::Min($a, $b)
    return [Math]::Round(($hi + 0.05) / ($lo + 0.05), 2)
}

$ink    = '#0B1013'   # page
$panel  = '#121A1E'   # rail, phone bottom strip
$raised = '#172227'   # frontier panel

# fg, bg, px, class, what carries it
$pairs = @(
    @('#EFF3F1', $ink,    54, 'large',  'statement "Level 2" (desktop 54px / phone 34px)'),
    @('#EFF3F1', $ink,    34, 'large',  'repo name desktop'),
    @('#EFF3F1', $ink,    30, 'large',  'next-fix title'),
    @('#EFF3F1', $raised, 17, 'normal', 'frontier check name'),
    @('#EFF3F1', $panel,  15, 'normal', 'level name in the rail'),
    @('#EFF3F1', $ink,    12, 'normal', 'button label "Bagikan" / "Buka panduan"'),
    @('#EFF3F1', $panel,  11, 'normal', 'wordmark DEVVERSE'),
    @('#63D9C6', $ink,    54, 'large',  'statement "lulus." (the pass word)'),
    @('#63D9C6', $raised, 11, 'normal', 'state word "lulus" on a check row'),
    @('#63D9C6', $panel,  10, 'normal', 'state word "lulus" in the rail'),
    @('#F0916B', $raised, 11, 'normal', 'state word "gagal" on a check row'),
    @('#F2B267', $raised, 10, 'normal', 'panel header "SEKARANG DI SINI"'),
    @('#F2B267', $ink,    10, 'normal', 'label "SATU PERBAIKAN BERIKUTNYA"'),
    @('#A6B3B0', $ink,    19, 'normal', 'subline "Berikutnya Level 3"'),
    @('#A6B3B0', $ink,    15, 'normal', 'repo description, next-fix body'),
    @('#A6B3B0', $raised, 13, 'normal', 'evidence path under a check'),
    @('#A6B3B0', $raised, 10, 'normal', 'state word "tidak_tahu" on a check row'),
    @('#A6B3B0', $panel,  13, 'normal', 'collapsed level checks in the rail'),
    @('#83918E', $ink,    12, 'normal', 'footer URL, telemetry line'),
    @('#83918E', $panel,  10, 'normal', 'rail labels, "belum sampai", engine line'),
    @('#83918E', $ink,    12, 'normal', 'phone bottom-strip label')
)

$fail = 0
"| text | on | px | ratio | needed | verdict | carries |"
"| --- | --- | --- | --- | --- | --- | --- |"
foreach ($p in $pairs) {
    $r = Get-Ratio $p[0] $p[1]
    $min = if ($p[3] -eq 'large') { 3.0 } else { 4.5 }
    $ok = $r -ge $min
    if (-not $ok) { $fail++ }
    $verdict = if ($ok) { 'PASS' } else { 'FAIL' }
    "| ``$($p[0])`` | ``$($p[1])`` | $($p[2]) | **$r`:1** | $min`:1 | $verdict | $($p[4]) |"
}
""
"pairs: $($pairs.Count)   fail: $fail"
