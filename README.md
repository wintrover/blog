# wintrover Blog

Fullstack AI Application Architect의 개발 블로그입니다. Jekyll에서 Svelte로 완전히 마이그레이션된 모던 블로그입니다.

## 🚀 기술 스택

- **Frontend**: Svelte + Vite
- **Styling**: CSS (컴포넌트 기반)
- **배포**: GitHub Pages + GitHub Actions
- **호스팅**: GitHub Pages

## 📁 프로젝트 구조

```
src/
├── components/          # Svelte 컴포넌트
│   ├── Header.svelte
│   ├── Sidebar.svelte
│   ├── BlogList.svelte
│   └── Footer.svelte
├── lib/                # 유틸리티 및 설정
│   ├── config.js       # 사이트 설정
│   ├── posts.js        # 포스트 데이터
│   └── utils.js        # 헬퍼 함수
├── stores/             # Svelte 스토어
│   ├── posts.js
│   └── category.js
├── App.svelte          # 메인 앱 컴포넌트
└── main.js            # 앱 진입점
```

## 🛠️ 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. 프로덕션 빌드

```bash
npm run build
```

## 📝 Dev.to 업로드

블로그 포스트를 dev.to에 자동으로 업로드할 수 있는 PowerShell 스크립트가 포함되어 있습니다.

### upload-to-devto.ps1 스크립트 사용법

이 스크립트는 마크다운 파일을 dev.to에 자동으로 업로드합니다.

#### 기본 사용법:
```powershell
.\upload-to-devto.ps1 -FilePath "_posts\your-post.md"
```

#### 매개변수:
- `-FilePath`: 업로드할 마크다운 파일 경로 (필수)
- `-Published`: 게시글을 바로 발행할지 여부 (기본값: false, 즉 Draft 상태)
- `-Tags`: 게시글 태그 (기본값: "webdev,javascript,ai,machinelearning")
- `-AddTimestamp`: 제목에 현재 시간 추가 (중복 제목 방지용)
- `-TestMode`: 테스트용 간단한 게시글 생성

#### 사용 예시:
```powershell
# 기본 업로드
.\upload-to-devto.ps1 -FilePath "_posts\2025-08-05-6.md"

# 타임스탬프 추가하여 업로드
.\upload-to-devto.ps1 -FilePath "_posts\2025-08-05-6.md" -AddTimestamp

# 테스트 모드로 업로드
.\upload-to-devto.ps1 -FilePath "_posts\2025-08-05-6.md" -TestMode
```

#### 기능:
- Jekyll front matter에서 제목 자동 추출
- Jekyll front matter 자동 제거 (dev.to에서 불필요)
- 이모지를 HTML 엔티티로 자동 변환
- UTF-8 인코딩으로 안전한 업로드
- 업로드 성공 시 Article ID와 URL 출력
- 상세한 오류 메시지 출력

#### 참고사항:
- API 키는 스크립트 내부에 하드코딩되어 있습니다
- 보안을 위해 실제 사용 시에는 환경변수나 별도 설정 파일 사용을 권장합니다

**참고**: 스크립트 사용 전에 `upload-to-devto.ps1` 파일의 `$API_KEY` 변수에 본인의 dev.to API 키를 설정해주세요.

## 🚀 배포

GitHub에 푸시하면 GitHub Actions가 자동으로 빌드하고 GitHub Pages에 배포합니다.

## ✨ 주요 기능

- ✅ 반응형 디자인
- ✅ 카테고리별 포스트 필터링
- ✅ 모던 Svelte 컴포넌트 아키텍처
- ✅ 자동 배포 파이프라인
- ✅ SEO 최적화
- ✅ 소셜 미디어 링크

## 📝 포스트 추가

`src/lib/posts.js` 파일에 새로운 포스트 데이터를 추가하세요:

```javascript
{
  title: "포스트 제목",
  date: "2025-08-09",
  category: "카테고리",
  tags: ["태그1", "태그2"],
  slug: "post-slug",
  excerpt: "포스트 요약..."
}
```

## 🎨 커스터마이징

- **사이트 설정**: `src/lib/config.js`
- **스타일링**: 각 컴포넌트의 `<style>` 섹션
- **레이아웃**: `src/App.svelte`

## 📄 라이선스

MIT License
