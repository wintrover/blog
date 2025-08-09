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
