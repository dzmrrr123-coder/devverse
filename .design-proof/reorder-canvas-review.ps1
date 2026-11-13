# Reorders ## Canvas review so the CURRENT round carries the fields the gate reads.
# Reason: design-direction-check.ps1 section 1e reads the FIRST `Verdict:` / `Approved by:`
# match in the section. With the refused round first, the gate reports REVISE forever - even
# after the human answers APPROVED - so the live round has to be the first block and the
# refusal stays below it as history. ASCII-only source; {DASH} is replaced at runtime so a
# BOM-less read by PowerShell 5.1 cannot mangle an em dash.

$path = Join-Path (Get-Location) 'DESIGN-DIRECTION.md'
$t = [System.IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
$dash = [string][char]0x2014

$startM = [regex]::Match($t, '(?m)^## Canvas review\s*$')
$endM = [regex]::Match($t, '(?m)^## Convergence ledger\s*$')
if (-not $startM.Success -or -not $endM.Success -or $endM.Index -le $startM.Index) {
    Write-Output 'ABORT: could not locate the two section headings'
    exit 1
}

$new = @'
## Canvas review

The current round is written first because the gate, and any reader, reads the first
`Verdict:` field in this section as the live state. With the refused round above it, the gate
would keep reporting REVISE even after the human answers, so the refusal is kept below as
history rather than deleted.

### Current {DASH} round 2, drawn and awaiting the verdict

Export: shots/meja-kerja-1440.png
Phone export: shots/meja-kerja-390.png
Shown: 2026-11-12, chat reply {DASH} both frames at scale 2, the 1440 and the 390 side by side,
with the contrast table and the percentage map in the same reply.
Verdict: PENDING
Approved by: awaiting the human {DASH} not yet given

### History {DASH} round 1, refused by the human

Export: shots/direction-1.png
Shown: 2026-11-12, chat reply {DASH} the three exported PNGs at 1440px (`direction-1.png`,
`direction-2.png`, `direction-3.png`), with direction 1 named as the pick.
Verdict: REVISE
Reason: the pick was made for build cost, not for the blend {DASH} *"gaada pilih arah design yg
murah"*. Direction 1 was rejected as a light paper surface, direction 3 as off-brief
(editorial sits outside the 40/30/20/10), and direction 2 was named the starting point with
its phone failure treated as the design problem to solve.
Approved by: not given {DASH} a refusal is not an approval

'@

$new = $new.Replace('{DASH}', $dash) -replace "`r?`n", "`r`n"
$t2 = $t.Substring(0, $startM.Index) + $new + $t.Substring($endM.Index)
[System.IO.File]::WriteAllText($path, $t2, (New-Object System.Text.UTF8Encoding($false)))
Write-Output ('rewritten: ' + $t2.Length + ' chars')
