# Production Deployment for Giscus

## Problem
GitHub Pages에 배포 시 환경 변수가 주입되지 않아 Giscus가 작동하지 않음

## Solution for GitHub Pages

### 1. GitHub Actions 설정
`.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Build and Deploy
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          VITE_GISCUS_REPO: wintrover/blog
          VITE_GISCUS_REPO_ID: R_kgDOGOEESY
          VITE_GISCUS_CATEGORY: General
          VITE_GISCUS_CATEGORY_ID: DIC_kwDOPBuacs4Cwqu_

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./_site
```

### 2. Manual Build (GitHub Actions 없이)
로컬에서 직접 빌드 후 배포:

```bash
# Windows
set VITE_GISCUS_REPO=wintrover/blog
set VITE_GISCUS_REPO_ID=R_kgDOGOEESY
set VITE_GISCUS_CATEGORY=General
set VITE_GISCUS_CATEGORY_ID=DIC_kwDOPBuacs4Cwqu_
npm run build

# 또는 .env.production 파일 생성
echo VITE_GISCUS_REPO=wintrover/blog > .env.production
echo VITE_GISCUS_REPO_ID=R_kgDOGOEESY >> .env.production
echo VITE_GISCUS_CATEGORY=General >> .env.production
echo VITE_GISCUS_CATEGORY_ID=DIC_kwDOPBuacs4Cwqu_ >> .env.production
npm run build
```

### 3. 확인 사항
- .env.production 파일이 .gitignore에 있는지 확인
- 빌드된 코드에 올바른 Giscus 설정값이 포함되었는지 확인

## 현재 상태
- ✅ 로컬 개발 환경: 정상 작동
- ❌ 배포된 사이트: 환경 변수 누락으로 작동 안 함