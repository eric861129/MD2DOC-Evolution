[CmdletBinding()]
param(
    [string]$ArtifactRoot,
    [string]$ReferenceDocx,
    [int]$TimeoutSeconds = 120
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
if ([string]::IsNullOrWhiteSpace($ArtifactRoot)) {
    $ArtifactRoot = Join-Path $repositoryRoot 'artifacts\docx-qa\acceptance'
}
$resolvedArtifactRoot = [IO.Path]::GetFullPath($ArtifactRoot)
$workerPath = Join-Path $PSScriptRoot 'word-worker.ps1'
if (-not (Test-Path -LiteralPath $workerPath -PathType Leaf)) {
    throw "找不到 Word 驗收 worker：$workerPath"
}

$runId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$runRoot = Join-Path (Join-Path $resolvedArtifactRoot 'word') $runId
New-Item -ItemType Directory -Path $runRoot -Force | Out-Null

$profileContracts = @(
    @{
        ProfileId = 'publisher-exact'
        FileStem = 'exact'
        MarginsCm = @{ Top = 2.1; Right = 2.3; Bottom = 2.1; Left = 2.3; Gutter = 0.0 }
    },
    @{
        ProfileId = 'publisher-narrow'
        FileStem = 'narrow'
        MarginsCm = @{ Top = 1.27; Right = 1.27; Bottom = 1.27; Left = 1.27; Gutter = 0.0 }
    },
    @{
        ProfileId = 'publisher-binding'
        FileStem = 'binding'
        MarginsCm = @{ Top = 2.0; Right = 1.8; Bottom = 2.2; Left = 2.2; Gutter = 0.5 }
    }
)

function Write-Utf8Json {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [object]$Value
    )

    $json = $Value | ConvertTo-Json -Depth 12
    $utf8WithoutBom = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($Path, "$json`n", $utf8WithoutBom)
}

function Stop-WorkerProcesses {
    param(
        [Parameter(Mandatory = $true)]
        [Diagnostics.Process]$WorkerProcess,
        [Parameter(Mandatory = $true)]
        [string]$WordProcessIdPath
    )

    if (-not $WorkerProcess.HasExited) {
        Stop-Process -Id $WorkerProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $WordProcessIdPath -PathType Leaf) {
        $wordProcessId = 0
        if (
            [int]::TryParse(
                (Get-Content -LiteralPath $WordProcessIdPath -Raw).Trim(),
                [ref]$wordProcessId
            ) -and
            $wordProcessId -gt 0 -and
            (Get-Process -Id $wordProcessId -ErrorAction SilentlyContinue)
        ) {
            Stop-Process -Id $wordProcessId -Force -ErrorAction SilentlyContinue
        }
    }
}

function Invoke-WordWorker {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$InputDocx,
        [string]$OutputPdf,
        [hashtable]$MarginsCm,
        [switch]$InspectOnly,
        [int]$WorkerTimeoutSeconds = 120
    )

    $outputJson = Join-Path $runRoot "$Name.json"
    $stdoutPath = Join-Path $runRoot "$Name.stdout.log"
    $stderrPath = Join-Path $runRoot "$Name.stderr.log"
    $wordProcessIdPath = Join-Path $runRoot "$Name.word.pid"
    $arguments = @(
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        $workerPath,
        '-InputDocx',
        $InputDocx,
        '-OutputJson',
        $outputJson,
        '-WordProcessIdPath',
        $wordProcessIdPath,
        '-ProfileId',
        $Name
    )
    if (-not [string]::IsNullOrWhiteSpace($OutputPdf)) {
        $arguments += @('-OutputPdf', $OutputPdf)
    }
    if ($null -ne $MarginsCm) {
        $arguments += @(
            '-ExpectedTopCm', [string]$MarginsCm.Top,
            '-ExpectedRightCm', [string]$MarginsCm.Right,
            '-ExpectedBottomCm', [string]$MarginsCm.Bottom,
            '-ExpectedLeftCm', [string]$MarginsCm.Left,
            '-ExpectedGutterCm', [string]$MarginsCm.Gutter
        )
    }
    if ($InspectOnly) {
        $arguments += '-InspectOnly'
    }

    Write-Host "WORD_WORKER start $Name"
    $workerProcess = Start-Process `
        -FilePath 'powershell.exe' `
        -ArgumentList $arguments `
        -WorkingDirectory $repositoryRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath `
        -PassThru
    try {
        if (-not $workerProcess.WaitForExit($WorkerTimeoutSeconds * 1000)) {
            throw "Word worker $Name 超過 $WorkerTimeoutSeconds 秒未完成。"
        }
        $workerProcess.Refresh()
        $exitCode = $workerProcess.ExitCode
        if ($null -ne $exitCode -and [int]$exitCode -ne 0) {
            $stderr = Get-Content `
                -LiteralPath $stderrPath `
                -Raw `
                -Encoding UTF8 `
                -ErrorAction SilentlyContinue
            throw "Word worker $Name 失敗（exit $exitCode）：$stderr"
        }
        if (-not (Test-Path -LiteralPath $outputJson -PathType Leaf)) {
            throw "Word worker $Name 未產生 JSON 報告。"
        }
        Write-Host "WORD_WORKER passed $Name"
        return Get-Content `
            -LiteralPath $outputJson `
            -Raw `
            -Encoding UTF8 |
            ConvertFrom-Json
    }
    finally {
        Stop-WorkerProcesses `
            -WorkerProcess $workerProcess `
            -WordProcessIdPath $wordProcessIdPath
    }
}

$profileResults = [Collections.Generic.List[object]]::new()
foreach ($profileContract in $profileContracts) {
    $docxPath = Join-Path $resolvedArtifactRoot "md2doc-$($profileContract.FileStem).docx"
    if (-not (Test-Path -LiteralPath $docxPath -PathType Leaf)) {
        throw "找不到出版社驗收 DOCX：$docxPath；請先執行 npm run qa:acceptance。"
    }
    $pdfPath = Join-Path $runRoot "md2doc-$($profileContract.FileStem).pdf"
    $profileResults.Add((Invoke-WordWorker `
        -Name $profileContract.ProfileId `
        -InputDocx $docxPath `
        -OutputPdf $pdfPath `
        -MarginsCm $profileContract.MarginsCm `
        -WorkerTimeoutSeconds $TimeoutSeconds))
}

$referenceResult = $null
if (-not [string]::IsNullOrWhiteSpace($ReferenceDocx)) {
    $resolvedReferenceDocx = (Resolve-Path -LiteralPath $ReferenceDocx).Path
    $referenceResult = Invoke-WordWorker `
        -Name 'reference-manuscript' `
        -InputDocx $resolvedReferenceDocx `
        -InspectOnly `
        -WorkerTimeoutSeconds ([Math]::Max($TimeoutSeconds, 180))
}

$report = @{
    GeneratedAt = [DateTime]::UtcNow.ToString('o')
    Status = if (@($profileResults | Where-Object { $_.Status -ne 'passed' }).Count -eq 0) {
        'passed'
    }
    else {
        'failed'
    }
    RunRoot = $runRoot
    Profiles = @($profileResults)
    Reference = $referenceResult
}
$jsonPath = Join-Path $runRoot 'word-acceptance-report.json'
Write-Utf8Json -Path $jsonPath -Value $report

$markdownLines = @(
    '# Microsoft Word 出版驗收',
    '',
    "- 總結果：$($report.Status)",
    "- 證據目錄：$runRoot",
    '',
    '| 版型 | 頁數 | PDF | 版面 | 黑點標記 | 真正清單 | 待辦清單 |',
    '| --- | ---: | --- | --- | --- | --- | --- |'
)
foreach ($result in $profileResults) {
    $checks = $result.Inspection.Checks
    $markdownLines += (
        "| $($result.ProfileId) | $($result.Inspection.PageCount) | " +
        "$(if ($checks.PdfExport) { '通過' } else { '失敗' }) | " +
        "$(if ($checks.Layout) { '通過' } else { '失敗' }) | " +
        "$(if ($checks.NonprintingPaginationMarkers) { '通過' } else { '失敗' }) | " +
        "$(if ($checks.RealBulletLists) { '通過' } else { '失敗' }) | " +
        "$(if ($checks.TaskListWithoutBullets) { '通過' } else { '失敗' }) |"
    )
}
$markdownLines += @(
    '',
    '完整量測值與段落清單請見 `word-acceptance-report.json`。',
    ''
)
$markdownPath = Join-Path $runRoot 'word-acceptance-report.md'
$utf8WithoutBom = New-Object Text.UTF8Encoding($false)
[IO.File]::WriteAllText(
    $markdownPath,
    "$($markdownLines -join [Environment]::NewLine)`n",
    $utf8WithoutBom
)

Write-Output "Word 出版驗收：$($report.Status)"
Write-Output "JSON 報告：$jsonPath"
Write-Output "Markdown 報告：$markdownPath"
if ($report.Status -ne 'passed') {
    exit 1
}
