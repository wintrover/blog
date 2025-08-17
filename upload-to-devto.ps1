param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [string]$ApiKey = $env:DEVTO_API_KEY,
    
    [switch]$Published = $false,
    
    [switch]$TestMode = $false,
    
    [switch]$AddTimestamp = $false
)

# API 키 확인 (테스트 모드가 아닐 때만)
if (-not $TestMode) {
    Write-Host "디버그: ApiKey 길이 = $($ApiKey.Length), 값 = '$ApiKey'"
    if (-not $ApiKey -or $ApiKey.Trim() -eq "") {
        Write-Error "API 키가 필요합니다. 환경변수 DEVTO_API_KEY를 설정하거나 -ApiKey 파라미터를 사용하세요."
        exit 1
    }
}

# 파일 존재 확인
if (-not (Test-Path $FilePath)) {
    Write-Error "파일을 찾을 수 없습니다: $FilePath"
    exit 1
}

# 마크다운 파일 읽기
$content = Get-Content $FilePath -Raw -Encoding UTF8

# Jekyll front matter에서 제목 추출
$title = ""
if ($content -match '(?s)^---([\s\S]*?)---') {
    $frontMatter = $matches[1]
    if ($frontMatter -match 'title:\s*"([^"]+)"') {
        $title = $matches[1].Trim()
    } elseif ($frontMatter -match "title:\s*'([^']+)'") {
        $title = $matches[1].Trim()
    } elseif ($frontMatter -match '(?m)^title:\s*(.+)$') {
        $title = $matches[1].Trim()
    }
}

# Jekyll front matter 제거 (dev.to에서 불필요)
$content = $content -replace '^---[\s\S]*?---\s*', ''

# 이미지 경로 수정 (상대 경로를 절대 경로로 변환)
$content = $content -replace '!\[([^\]]*)\]\((?!https?://)([^\)]+)\)', '![${1}](https://wintrover.github.io/blog/${2}'

# 제목이 없으면 첫 번째 # 헤더에서 추출
if (-not $title -and $content -match '^#\s+(.+)$') {
    $title = $matches[1].Trim()
}

# 여전히 제목이 없으면 파일명에서 생성
if (-not $title) {
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($FilePath)
    $title = $fileName -replace '^\d{4}-\d{2}-\d{2}-\d+', '' -replace '^-+', '' -replace '-', ' '
    $title = (Get-Culture).TextInfo.ToTitleCase($title.ToLower())
}

# 타임스탬프 추가 (옵션)
if ($AddTimestamp) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $title += " [$timestamp]"
}

# 태그 추출 (마크다운 끝부분의 **Tags**: 섹션에서)
$tags = @()
if ($content -match '\*\*Tags\*\*:\s*(.+)') {
    $tagString = $matches[1]
    $tags = $tagString -split '[,#\s]+' | Where-Object { $_ -and $_.Length -gt 0 -and $_.Length -le 20 } | ForEach-Object { $_.Trim().ToLower() } | Select-Object -First 4
    Write-Host "디버그: 추출된 태그 = $($tags -join ', ')"
}

# API 요청 데이터 준비 (dev.to API 형식에 맞춤)
$articleData = @{
    article = @{
        title = $title
        body_markdown = $content
        published = $Published.IsPresent
        tags = $tags
    }
}

$jsonData = $articleData | ConvertTo-Json -Depth 3
# UTF-8 인코딩으로 변환
$utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonData)
$jsonData = [System.Text.Encoding]::UTF8.GetString($utf8Bytes)

# 테스트 모드
if ($TestMode) {
    Write-Host "=== 테스트 모드 ==="
    Write-Host "제목: $title"
    Write-Host "발행 상태: $(if ($Published) { '발행됨' } else { '초안' })"
    Write-Host "태그: $($tags -join ', ')"
    Write-Host "내용 길이: $($content.Length) 문자"
    Write-Host "JSON 데이터:"
    Write-Host $jsonData
    return
}

# dev.to API 호출
try {
    $headers = @{
        'api-key' = $ApiKey
        'Content-Type' = 'application/json'
        'User-Agent' = 'PowerShell/wintrover-blog-uploader'
    }
    
    Write-Host "dev.to에 업로드 중..."
    
    # UTF-8 바이트 배열로 변환
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonData)
    $response = Invoke-RestMethod -Uri 'https://dev.to/api/articles' -Method Post -Headers $headers -Body $bodyBytes
    
    Write-Host "✅ 성공적으로 업로드되었습니다!"
    Write-Host "📝 제목: $($response.title)"
    Write-Host "🔗 URL: $($response.url)"
    Write-Host "📊 상태: $(if ($response.published) { '발행됨' } else { '초안' })"
    Write-Host "🏷️ 태그: $($response.tag_list -join ', ')"
    
} catch {
    Write-Host "업로드 실패: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception -is [System.Net.WebException]) {
        $response = $_.Exception.Response
        Write-Host "HTTP 상태 코드: $($response.StatusCode)" -ForegroundColor Red
        
        if ($response) {
            try {
                $stream = $response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $errorContent = $reader.ReadToEnd()
                Write-Host "API 에러 응답: $errorContent" -ForegroundColor Red
            } catch {
                Write-Host "에러 상세 정보를 읽을 수 없습니다." -ForegroundColor Red
            }
        }
    } else {
        Write-Host "예외 타입: $($_.Exception.GetType().Name)" -ForegroundColor Red
        Write-Host "전체 에러: $($_.Exception | Out-String)" -ForegroundColor Red
    }
    
    Write-Host "전송된 JSON 데이터:" -ForegroundColor Yellow
    Write-Host $jsonData -ForegroundColor Yellow
    exit 1
}