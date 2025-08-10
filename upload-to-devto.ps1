# Dev.to 업로드 스크립트
# 사용법: .\upload-to-devto.ps1 -FilePath "_posts\2025-08-05-6.md" [-Published $false]

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$false)]
    [bool]$Published = $false,
    
    [Parameter(Mandatory=$false)]
    [string[]]$Tags = @("webdev", "javascript", "ai", "machinelearning"),
    
    [Parameter(Mandatory=$false)]
    [switch]$AddTimestamp,
    
    [Parameter(Mandatory=$false)]
    [switch]$TestMode
)

# API 키 설정 (여기에 본인의 API 키를 넣으세요)
$API_KEY = "PfMXMohQvXep7bkALUhXhc3E"

# 파일 존재 확인
if (-not (Test-Path $FilePath)) {
    Write-Error "파일을 찾을 수 없습니다: $FilePath"
    exit 1
}

# 테스트 모드인 경우 간단한 내용 사용
if ($TestMode) {
    $content = "# Test Article\n\nThis is a test article created at $(Get-Date).\n\n## Test Section\n\nTest content for dev.to upload."
    $title = "Test Article $(Get-Date -Format 'yyyyMMdd-HHmmss')"
} else {
    # 마크다운 파일 읽기 (UTF-8 인코딩)
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    
    # Jekyll front matter에서 제목 추출 후 제거
    $frontMatterMatch = $content | Select-String -Pattern 'title:\s*["''](.+)["'']' | Select-Object -First 1
    if ($frontMatterMatch) {
        $title = $frontMatterMatch.Matches[0].Groups[1].Value.Trim()
    }
    
    # Jekyll front matter 제거
    $content = $content -replace '^---[\s\S]*?---\s*', ''
}

# 테스트 모드가 아닌 경우에만 제목 추출 (front matter에서 이미 추출됨)
if (-not $TestMode -and -not $title) {
    # 첫 번째 # 헤더에서 제목 추출
    $titleMatch = $content | Select-String -Pattern '^#\s+(.+)$' | Select-Object -First 1
    if ($titleMatch) {
        $title = $titleMatch.Matches[0].Groups[1].Value.Trim()
    } else {
        # 파일명에서 제목 생성
        $fileName = [System.IO.Path]::GetFileNameWithoutExtension($FilePath)
        $title = $fileName -replace '^\d{4}-\d{2}-\d{2}-\d+', '' -replace '-', ' '
        $title = (Get-Culture).TextInfo.ToTitleCase($title.Trim())
    }
}

# 타임스탬프 추가 옵션
if ($AddTimestamp) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $title = "$title ($timestamp)"
}

Write-Host "제목: $title"

# 이모지를 HTML 엔티티로 변환
$content = $content -replace '🎯', '&#x1F3AF;'
$content = $content -replace '🚀', '&#x1F680;'
$content = $content -replace '🏗️', '&#x1F3D7;'
$content = $content -replace '🌐', '&#x1F310;'
$content = $content -replace '🔧', '&#x1F527;'
$content = $content -replace '📊', '&#x1F4CA;'
$content = $content -replace '✅', '&#x2705;'
$content = $content -replace '🔄', '&#x1F504;'
$content = $content -replace '🎯', '&#x1F3AF;'
$content = $content -replace '💡', '&#x1F4A1;'

# JSON 데이터 생성
$articleData = @{
    article = @{
        title = $title
        published = $Published
        body_markdown = $content
        tags = $Tags
    }
} | ConvertTo-Json -Depth 10

# 임시 JSON 파일 생성
$tempJsonFile = "temp_devto_article.json"
$articleData | Out-File -FilePath $tempJsonFile -Encoding UTF8

try {
    # Dev.to API 호출
    $headers = @{
        'Content-Type' = 'application/json'
        'api-key' = $API_KEY
    }
    
    $jsonContent = Get-Content $tempJsonFile -Raw -Encoding UTF8
    $response = Invoke-RestMethod -Uri 'https://dev.to/api/articles' -Method POST -Headers $headers -Body $jsonContent
    
    Write-Host "✅ 업로드 성공!"
    Write-Host "Article ID: $($response.id)"
    Write-Host "Article URL: $($response.url)"
    Write-Host "상태: $(if ($Published) { '공개' } else { 'Draft' })"
    
} catch {
    Write-Error "업로드 실패: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "응답 내용: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "응답 내용을 읽을 수 없습니다." -ForegroundColor Red
        }
    }
    
    # 상세 오류 정보 출력
    Write-Host "오류 세부사항:" -ForegroundColor Yellow
    Write-Host "StatusCode: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    Write-Host "StatusDescription: $($_.Exception.Response.StatusDescription)" -ForegroundColor Yellow
} finally {
    # 임시 파일 삭제
    if (Test-Path $tempJsonFile) {
        Remove-Item $tempJsonFile
    }
}