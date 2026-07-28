$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$artifactRoot = Join-Path $repositoryRoot 'artifacts\docx-qa'
$docxPath = Join-Path $artifactRoot 'publisher-fixture.docx'
$dpi = 110

function Resolve-RequiredExecutable {
    param(
        [Parameter(Mandatory = $true)]
        [string]$EnvironmentVariable
    )

    $configuredPath = [Environment]::GetEnvironmentVariable($EnvironmentVariable)
    if ([string]::IsNullOrWhiteSpace($configuredPath)) {
        throw "缺少 $EnvironmentVariable；請將它設為明確的執行檔路徑。"
    }
    if (-not (Test-Path -LiteralPath $configuredPath -PathType Leaf)) {
        throw "$EnvironmentVariable 指向的檔案不存在：$configuredPath"
    }
    return (Resolve-Path -LiteralPath $configuredPath).Path
}

function Invoke-CheckedProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Executable,
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [Parameter(Mandatory = $true)]
        [string]$LogDirectory,
        [Parameter(Mandatory = $true)]
        [string]$LogName
    )

    $standardOutputPath = Join-Path $LogDirectory "$LogName.stdout.log"
    $standardErrorPath = Join-Path $LogDirectory "$LogName.stderr.log"
    $quotedArguments = @($Arguments | ForEach-Object {
        if ($_ -match '[\s"]') {
            return '"' + $_.Replace('"', '\"') + '"'
        }
        return $_
    })
    $process = Start-Process `
        -FilePath $Executable `
        -ArgumentList $quotedArguments `
        -RedirectStandardOutput $standardOutputPath `
        -RedirectStandardError $standardErrorPath `
        -WindowStyle Hidden `
        -Wait `
        -PassThru
    $outputParts = @(
        (Get-Content -LiteralPath $standardOutputPath -Raw -ErrorAction SilentlyContinue),
        (Get-Content -LiteralPath $standardErrorPath -Raw -ErrorAction SilentlyContinue)
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    $outputText = ($outputParts -join [Environment]::NewLine).Trim()
    if ($process.ExitCode -ne 0) {
        throw "執行失敗（exit $($process.ExitCode)）：$Executable`n$outputText"
    }
    return $outputText
}

function Write-Utf8Json {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [object]$Value
    )

    $json = $Value | ConvertTo-Json -Depth 8
    $utf8WithoutBom = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($Path, "$json`n", $utf8WithoutBom)
}

$sofficePath = Resolve-RequiredExecutable -EnvironmentVariable 'SOFFICE_PATH'
$pdftoppmPath = Resolve-RequiredExecutable -EnvironmentVariable 'PDFTOPPM_PATH'
if (-not (Test-Path -LiteralPath $docxPath -PathType Leaf)) {
    throw "找不到 fixture DOCX：$docxPath；請先執行 npm run qa:fixture。"
}

$fontRegistryPaths = @(
    'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts',
    'HKCU:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts'
)
$notoSansTcEntries = @()
foreach ($fontRegistryPath in $fontRegistryPaths) {
    if (Test-Path -LiteralPath $fontRegistryPath) {
        $notoSansTcEntries += (Get-ItemProperty -LiteralPath $fontRegistryPath).PSObject.Properties |
            Where-Object { $_.Name -match '^Noto Sans TC' } |
            ForEach-Object { "$($_.Name)=$($_.Value)" }
    }
}
if ($notoSansTcEntries.Count -eq 0) {
    throw '固定渲染環境缺少 Noto Sans TC；不產生可作為 baseline 的 PNG。'
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$renderDirectory = Join-Path (Join-Path $artifactRoot 'renders') $timestamp
$pagesDirectory = Join-Path $renderDirectory 'pages'
$userProfileDirectory = Join-Path $renderDirectory 'libreoffice-profile'
New-Item -ItemType Directory -Path $pagesDirectory | Out-Null
New-Item -ItemType Directory -Path $userProfileDirectory | Out-Null

$userInstallationUri = ([Uri](Resolve-Path -LiteralPath $userProfileDirectory).Path).AbsoluteUri
$libreOfficeVersion = (Get-Item -LiteralPath $sofficePath).VersionInfo.ProductVersion
$libreOfficePythonPath = Join-Path (Split-Path -Parent $sofficePath) 'python.exe'
$unoScriptPath = Join-Path $PSScriptRoot 'update-docx-fields.py'
if (-not (Test-Path -LiteralPath $libreOfficePythonPath -PathType Leaf)) {
    throw "LibreOffice 安裝缺少內建 Python/UNO：$libreOfficePythonPath"
}
if (-not (Test-Path -LiteralPath $unoScriptPath -PathType Leaf)) {
    throw "缺少 DOCX field updater：$unoScriptPath"
}
Write-Output "開始渲染：$renderDirectory"
Write-Output "LibreOffice executable：$sofficePath"
Write-Output "Poppler executable：$pdftoppmPath"
$popplerVersion = Invoke-CheckedProcess `
    -Executable $pdftoppmPath `
    -Arguments @('-v') `
    -LogDirectory $renderDirectory `
    -LogName 'pdftoppm-version'
Write-Output "已讀取 Poppler 版本：$popplerVersion"

$pdfPath = Join-Path $renderDirectory 'publisher-fixture.pdf'
$libreOfficeOutput = Invoke-CheckedProcess `
    -Executable $libreOfficePythonPath `
    -Arguments @(
        $unoScriptPath,
        '--soffice',
        $sofficePath,
        '--user-installation',
        $userInstallationUri,
        '--input',
        $docxPath,
        '--output',
        $pdfPath,
        '--working-directory',
        $repositoryRoot,
        '--stdout-log',
        (Join-Path $renderDirectory 'libreoffice-server.stdout.log'),
        '--stderr-log',
        (Join-Path $renderDirectory 'libreoffice-server.stderr.log')
    ) `
    -LogDirectory $renderDirectory `
    -LogName 'libreoffice-update-export'
Write-Output "LibreOffice field update/PDF export：$libreOfficeOutput"

if (-not (Test-Path -LiteralPath $pdfPath -PathType Leaf)) {
    throw "LibreOffice 未產生預期 PDF：$pdfPath`n$libreOfficeOutput"
}

$pagePrefix = Join-Path $pagesDirectory 'page'
$popplerOutput = Invoke-CheckedProcess `
    -Executable $pdftoppmPath `
    -Arguments @(
        '-png',
        '-r',
        $dpi.ToString([Globalization.CultureInfo]::InvariantCulture),
        $pdfPath,
        $pagePrefix
    ) `
    -LogDirectory $renderDirectory `
    -LogName 'pdftoppm-render'
Write-Output 'Poppler PNG 轉換命令已完成。'

$pageFiles = @(Get-ChildItem -LiteralPath $pagesDirectory -File -Filter '*.png' |
    Sort-Object {
        if ($_.BaseName -match '^page-(\d+)$') {
            return [int]$Matches[1]
        }
        return [int]::MaxValue
    })
if ($pageFiles.Count -eq 0) {
    throw "Poppler 未產生 PNG：$pagesDirectory`n$popplerOutput"
}

$relativePagesDirectory = [IO.Path]::GetFullPath($pagesDirectory).Substring(
    [IO.Path]::GetFullPath($artifactRoot).Length
).TrimStart('\', '/').Replace('\', '/')
$relativeRenderDirectory = [IO.Path]::GetFullPath($renderDirectory).Substring(
    [IO.Path]::GetFullPath($artifactRoot).Length
).TrimStart('\', '/').Replace('\', '/')
$metadata = [ordered]@{
    schemaVersion = 1
    createdAt = (Get-Date).ToString('o')
    platform = 'Windows 11'
    dpi = $dpi
    fontAssumptions = [ordered]@{
        required = 'Noto Sans TC'
        detected = $true
        registryEntries = @($notoSansTcEntries)
    }
    libreOffice = [ordered]@{
        path = $sofficePath
        version = $libreOfficeVersion
        userInstallation = $userInstallationUri
    }
    poppler = [ordered]@{
        path = $pdftoppmPath
        version = $popplerVersion
    }
    sourceDocx = $docxPath
    pdf = $pdfPath
    renderDirectory = $relativeRenderDirectory
    pagesDirectory = $relativePagesDirectory
    pageCount = $pageFiles.Count
    pages = @($pageFiles | ForEach-Object { $_.Name })
}

$renderMetadataPath = Join-Path $renderDirectory 'render-metadata.json'
$latestManifestPath = Join-Path $artifactRoot 'latest-render.json'
Write-Utf8Json -Path $renderMetadataPath -Value $metadata
Write-Utf8Json -Path $latestManifestPath -Value $metadata

Write-Output "LibreOffice version：$libreOfficeVersion"
Write-Output "Poppler version：$popplerVersion"
Write-Output "DPI：$dpi"
Write-Output 'Font assumption：Noto Sans TC（已由 Windows Fonts registry 偵測）'
Write-Output "PDF：$pdfPath"
Write-Output "PNG directory：$pagesDirectory"
Write-Output "Page count：$($pageFiles.Count)"
foreach ($pageFile in $pageFiles) {
    Write-Output "PNG：$($pageFile.FullName)"
}
Write-Output "Latest manifest：$latestManifestPath"
