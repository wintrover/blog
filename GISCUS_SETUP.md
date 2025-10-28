# Giscus 댓글 시스템 설정 가이드

## 개요
이 블로그는 Giscus 댓글 시스템을 사용합니다. Giscus는 GitHub Discussions를 기반으로 한 무료 댓글 위젯입니다.

## 설정 단계

### 1. GitHub Repository에서 Discussions 활성화

1. 블로그 저장소(wintrover/blog)로 이동
2. Settings 탭 클릭
3. Features 섹션에서 **Discussions** 체크박스 활성화
4. Set up Discussions 버튼 클릭

### 2. Giscus 설정

1. [Giscus 공식 사이트](https://giscus.app) 방문
2. Configuration 섹션에서 다음 설정 입력:
   - **repository**: `wintrover/blog`
   - **page ↔️ discussions mapping**: `pathname` (URL 경로 기반)
   - **Discussion category**: `General` (또는 원하는 카테고리)
   - **Features**:
     - ✅ Enable reactions
     - ✅ Send me email notifications about new discussions

3. GitHub으로 로그인하여 Giscus 앱 권한 부여
4. 생성된 설정 값을 복사

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 값을 추가:

```bash
# Giscus Configuration
VITE_GISCUS_REPO=wintrover/blog
VITE_GISCUS_REPO_ID=R_kgDOKkT5Gg
VITE_GISCUS_CATEGORY=General
VITE_GISCUS_CATEGORY_ID=DIC_kwDOKkT5Gs4CY4vM
```

### 4. 댓글 카테고리 생성 (선택 사항)

GitHub Discussions에서 댓글을 위한 카테고리를 미리 생성할 수 있습니다:

1. Repository의 Discussions 탭으로 이동
2. New category 버튼 클릭
3. Category 이름 입력 (예: "Comments")
4. Category 설정:
   - ✅ Allow discussions
   - ✅ Allow announcements
   - 🔄 Require moderation (필요시)

## 댓글 시스템 기능

### 주요 기능
- **GitHub 인증**: GitHub 계정으로 로그인하여 댓글 작성
- **Markdown 지원**: 풍부한 서식의 댓글 작성 가능
- **반응 기능**: 👍 ❤️ 😄 🎉 등 이모지 반응
- **답글 기능**: 스레드 형태의 대화 가능
- **자동 테마**: 라이트/다크 모드 자동 전환
- **한국어 지원**: 한국어 인터페이스 제공

### 댓글 작성 방법
1. GitHub 계정으로 로그인
2. 댓글 텍스트 상자에 내용 작성
3. Markdown으로 서식 지정 가능
4. Submit 버튼 클릭

## 관리 기능

### 댓글 관리
- 모든 댓글은 GitHub Discussions에 저장됨
- Repository의 Discussions 탭에서 모든 댓글 관리 가능
- 댓글 수정, 삭제, 숨기기 기능 지원

### 알림 설정
- 새 댓글 알림: GitHub Settings > Notifications > Subscriptions
- 이메일 알림: Giscus 설정에서 활성화

## 테마 설정

기본 테마는 `preferred_color_scheme`으로 설정되어 사용자의 시스템 테마를 따릅니다. 다른 테마로 변경하려면 `src/lib/giscus-config.js` 파일에서 `theme` 값을 수정하세요:

```javascript
theme: 'light'      // 라이트 모드
// theme: 'dark'     // 다크 모드
// theme: 'transparent_dark'  // 투명 다크 모드
```

## 문제 해결

### 댓글이 표시되지 않을 때
1. GitHub Discussions가 활성화되어 있는지 확인
2. Giscus 설정값이 올바른지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 댓글 작성이 안될 때
1. GitHub에 로그인되어 있는지 확인
2. GitHub 앱 권한이 부여되었는지 확인
3. Repository에 대한 쓰기 권한이 있는지 확인

## 추가 정보

- [Giscus 공식 문서](https://giscus.app/)
- [GitHub Discussions 가이드](https://docs.github.com/en/discussions)