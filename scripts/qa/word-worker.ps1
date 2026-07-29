[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$InputDocx,
    [string]$OutputPdf,
    [Parameter(Mandatory = $true)]
    [string]$OutputJson,
    [Parameter(Mandatory = $true)]
    [string]$WordProcessIdPath,
    [Parameter(Mandatory = $true)]
    [string]$ProfileId,
    [double]$ExpectedTopCm = 0,
    [double]$ExpectedRightCm = 0,
    [double]$ExpectedBottomCm = 0,
    [double]$ExpectedLeftCm = 0,
    [double]$ExpectedGutterCm = 0,
    [switch]$InspectOnly
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$expectedBulletTexts = @(
    '檢查北方定位刻度',
    '記錄觀測時間',
    '確認星圖紙張編號'
)

function Convert-PointsToCentimeters {
    param([double]$Points)
    return [Math]::Round($Points * 2.54 / 72, 2)
}

function Test-CentimeterValue {
    param(
        [double]$Actual,
        [double]$Expected
    )
    return [Math]::Abs($Actual - $Expected) -le 0.02
}

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

function Get-ParagraphFlag {
    param(
        [Parameter(Mandatory = $true)]
        [object]$ParagraphFormat,
        [Parameter(Mandatory = $true)]
        [string]$PropertyName
    )

    try {
        return [int]$ParagraphFormat.$PropertyName
    }
    catch {
        return 0
    }
}

function Update-DocumentFields {
    param([Parameter(Mandatory = $true)][object]$Document)

    foreach ($storyRange in @($Document.StoryRanges)) {
        $currentRange = $storyRange
        while ($null -ne $currentRange) {
            if ($currentRange.Fields.Count -gt 0) {
                [void]$currentRange.Fields.Update()
            }
            $currentRange = $currentRange.NextStoryRange
        }
    }
}

function Get-DocumentInspection {
    param([Parameter(Mandatory = $true)][object]$Document)

    $pageSetup = $Document.Sections.Item(1).PageSetup
    $page = @{
        WidthCm = Convert-PointsToCentimeters -Points $pageSetup.PageWidth
        HeightCm = Convert-PointsToCentimeters -Points $pageSetup.PageHeight
        TopCm = Convert-PointsToCentimeters -Points $pageSetup.TopMargin
        RightCm = Convert-PointsToCentimeters -Points $pageSetup.RightMargin
        BottomCm = Convert-PointsToCentimeters -Points $pageSetup.BottomMargin
        LeftCm = Convert-PointsToCentimeters -Points $pageSetup.LeftMargin
        GutterCm = Convert-PointsToCentimeters -Points $pageSetup.Gutter
    }
    $invalidPaginationParagraphs = [Collections.Generic.List[object]]::new()
    $taskParagraphs = [Collections.Generic.List[object]]::new()
    $matchedBulletParagraphs = [Collections.Generic.List[object]]::new()

    for ($index = 1; $index -le $Document.Paragraphs.Count; $index += 1) {
        $paragraph = $Document.Paragraphs.Item($index)
        $text = ([string]$paragraph.Range.Text).Trim([char]13, [char]7, [char]32)
        $format = $paragraph.Format
        $flags = @{
            KeepWithNext = Get-ParagraphFlag -ParagraphFormat $format -PropertyName 'KeepWithNext'
            KeepTogether = Get-ParagraphFlag -ParagraphFormat $format -PropertyName 'KeepTogether'
            PageBreakBefore = Get-ParagraphFlag -ParagraphFormat $format -PropertyName 'PageBreakBefore'
            NoLineNumber = Get-ParagraphFlag -ParagraphFormat $format -PropertyName 'NoLineNumber'
        }
        if (@($flags.Values | Where-Object { $_ -ne 0 }).Count -gt 0) {
            $invalidPaginationParagraphs.Add(@{
                Index = $index
                Text = $text
                Flags = $flags
            })
        }

        $listType = [int]$paragraph.Range.ListFormat.ListType
        if ($text -match '^[☐☒]') {
            $taskParagraphs.Add(@{
                Index = $index
                Text = $text
                ListType = $listType
            })
        }
        if ($expectedBulletTexts -contains $text) {
            $matchedBulletParagraphs.Add(@{
                Index = $index
                Text = $text
                ListType = $listType
            })
        }
    }

    $layoutPassed = (
        (Test-CentimeterValue -Actual $page.WidthCm -Expected 17.6) -and
        (Test-CentimeterValue -Actual $page.HeightCm -Expected 23.6) -and
        (Test-CentimeterValue -Actual $page.TopCm -Expected $ExpectedTopCm) -and
        (Test-CentimeterValue -Actual $page.RightCm -Expected $ExpectedRightCm) -and
        (Test-CentimeterValue -Actual $page.BottomCm -Expected $ExpectedBottomCm) -and
        (Test-CentimeterValue -Actual $page.LeftCm -Expected $ExpectedLeftCm) -and
        (Test-CentimeterValue -Actual $page.GutterCm -Expected $ExpectedGutterCm)
    )
    $checks = @{
        PdfExport = $InspectOnly -or (
            -not [string]::IsNullOrWhiteSpace($OutputPdf) -and
            (Test-Path -LiteralPath $OutputPdf -PathType Leaf) -and
            (Get-Item -LiteralPath $OutputPdf).Length -gt 0
        )
        Layout = $InspectOnly -or $layoutPassed
        NonprintingPaginationMarkers = $invalidPaginationParagraphs.Count -eq 0
        TaskListWithoutBullets = $InspectOnly -or (
            $taskParagraphs.Count -eq 2 -and
            @($taskParagraphs | Where-Object { $_.ListType -ne 0 }).Count -eq 0
        )
        RealBulletLists = $InspectOnly -or (
            $matchedBulletParagraphs.Count -eq $expectedBulletTexts.Count -and
            @($matchedBulletParagraphs | Where-Object { $_.ListType -eq 0 }).Count -eq 0
        )
    }

    return @{
        PageCount = [int]$Document.ComputeStatistics(2)
        ParagraphCount = [int]$Document.Paragraphs.Count
        Page = $page
        InvalidPaginationParagraphs = @($invalidPaginationParagraphs)
        TaskParagraphs = @($taskParagraphs)
        BulletParagraphs = @($matchedBulletParagraphs)
        Checks = $checks
    }
}

function Get-ReferenceInspection {
    param([Parameter(Mandatory = $true)][object]$Document)

    $pageSetup = $Document.Sections.Item(1).PageSetup
    $normalStyle = $Document.Styles.Item(-1)
    return @{
        PageCount = [int]$Document.ComputeStatistics(2)
        ParagraphCount = 0
        Page = @{
            WidthCm = Convert-PointsToCentimeters -Points $pageSetup.PageWidth
            HeightCm = Convert-PointsToCentimeters -Points $pageSetup.PageHeight
            TopCm = Convert-PointsToCentimeters -Points $pageSetup.TopMargin
            RightCm = Convert-PointsToCentimeters -Points $pageSetup.RightMargin
            BottomCm = Convert-PointsToCentimeters -Points $pageSetup.BottomMargin
            LeftCm = Convert-PointsToCentimeters -Points $pageSetup.LeftMargin
            GutterCm = Convert-PointsToCentimeters -Points $pageSetup.Gutter
        }
        NormalStyle = @{
            FontLatin = [string]$normalStyle.Font.Name
            FontEastAsia = [string]$normalStyle.Font.NameFarEast
            FontSize = [double]$normalStyle.Font.Size
            SpaceBefore = [double]$normalStyle.ParagraphFormat.SpaceBefore
            SpaceAfter = [double]$normalStyle.ParagraphFormat.SpaceAfter
            LineSpacing = [double]$normalStyle.ParagraphFormat.LineSpacing
            LineSpacingRule = [int]$normalStyle.ParagraphFormat.LineSpacingRule
        }
        InvalidPaginationParagraphs = @()
        TaskParagraphs = @()
        BulletParagraphs = @()
        Checks = @{
            PdfExport = $true
            Layout = $true
            NonprintingPaginationMarkers = $true
            TaskListWithoutBullets = $true
            RealBulletLists = $true
        }
    }
}

$wordType = [Type]::GetTypeFromProgID('Word.Application')
if ($null -eq $wordType) {
    throw '找不到 Microsoft Word COM。'
}

$word = $null
$document = $null
$existingWordProcessIds = @(
    Get-Process -Name 'WINWORD' -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty Id
)
try {
    Write-Output "WORD_STAGE create $ProfileId"
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    try {
        $word.AutomationSecurity = 3
    }
    catch {
        # 舊版 Word 可能不提供 AutomationSecurity；仍維持唯讀開啟。
    }
    Start-Sleep -Milliseconds 200
    $createdWordProcess = Get-Process -Name 'WINWORD' -ErrorAction SilentlyContinue |
        Where-Object { $existingWordProcessIds -notcontains $_.Id } |
        Sort-Object -Property StartTime -Descending |
        Select-Object -First 1
    if ($null -ne $createdWordProcess) {
        [IO.File]::WriteAllText(
            $WordProcessIdPath,
            [string]$createdWordProcess.Id
        )
    }

    Write-Output "WORD_STAGE open $ProfileId"
    $document = $word.Documents.Open($InputDocx, $false, $true, $false)
    if (-not $InspectOnly) {
        Write-Output "WORD_STAGE update-fields $ProfileId"
        Update-DocumentFields -Document $document
        Write-Output "WORD_STAGE export-pdf $ProfileId"
        $document.ExportAsFixedFormat($OutputPdf, 17)
    }

    # WORD_STAGE inspect 必須在 PDF export 後，避免 Word exporter 與格式列舉互鎖。
    Write-Output "WORD_STAGE inspect $ProfileId"
    $inspection = if ($InspectOnly) {
        Get-ReferenceInspection -Document $document
    }
    else {
        Get-DocumentInspection -Document $document
    }
    $report = @{
        ProfileId = $ProfileId
        WordVersion = [string]$word.Version
        DocumentPath = [IO.Path]::GetFullPath($InputDocx)
        PdfPath = if ($InspectOnly) { $null } else { [IO.Path]::GetFullPath($OutputPdf) }
        PdfBytes = if ($InspectOnly) { 0 } else { (Get-Item -LiteralPath $OutputPdf).Length }
        Inspection = $inspection
        Status = if (@($inspection.Checks.Values | Where-Object { -not $_ }).Count -eq 0) {
            'passed'
        }
        else {
            'failed'
        }
    }
    Write-Utf8Json -Path $OutputJson -Value $report
}
finally {
    if ($null -ne $document) {
        $document.Close(0)
    }
    if ($null -ne $word) {
        $word.Quit()
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
