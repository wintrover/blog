# CLAUDE.md

## Rules
- 한국어로 답해라
- context7 공식문서를 봐라
- 더미 쓰지 마라
- solid 원칙을 지키며 모듈화 해라
- git add . 써라
- 커밋 메시지는 영어로 써라
- 코드 수정할때마다 린트와 테스트를 돌려서 이상이 없는지 확인 후 푸시해라
- 테스트 파일은 모두 테스트 폴더 안에 만들어라
- 일반 디버깅 메시지는 넣지 말고 예외처리용 디버깅만 상세하게 해라
- mvp에만 집중하고 성능 최적화나 잡다한건 하지마, 핵심만 만들어
- 투두리스트의 태스크 하나 할때마다 구현이 올바른지 구동해봐라

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development Workflow
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build locally
npm test             # Run all tests (image path normalization, dev.to absolutization)
```

### Content Management
```bash
# Publish to dev.to (requires .env with DEVTO_API_KEY)
npm run post:devto <path-to-markdown-file>

# Example:
npm run post:devto src/posts/my-post.md
```

### Testing
Run individual test modules:
```bash
node tests/devto-absolutize.test.js      # Test dev.to URL absolutization
node tests/markdown-image-paths.test.js  # Test markdown image path normalization
```

## Architecture Overview

### Content Architecture
- **Markdown-based posts**: All blog posts are stored in `src/posts/` with YAML front matter
- **Dynamic loading**: Uses Vite's `import.meta.glob` for automatic post discovery
- **Slug generation**: Automatically generated from post titles using `slugifyTitle()`
- **Front matter parsing**: Custom YAML parser in `postLoader.js` handles metadata extraction

### Key Components Structure
```
src/
├── components/         # UI components
│   ├── BlogList.svelte    # Post listing with category filtering
│   ├── PostDetail.svelte  # Individual post rendering
│   ├── Sidebar.svelte     # Navigation and category filter
│   └── Footer.svelte      # Site footer
├── lib/               # Core utilities
│   ├── config.js          # Site configuration and metadata
│   ├── markdown.js        # Markdown processing with image path normalization
│   ├── postLoader.js      # Dynamic post loading and front matter parsing
│   └── utils.js           # Helper functions
├── stores/            # Svelte reactive state
│   ├── posts.js           # Post data management
│   └── category.js        # Category filtering state
└── posts/            # Markdown blog posts
```

### Image Path Handling
The project implements sophisticated image path normalization to handle different deployment scenarios:
- **Development**: Relative paths work normally
- **Production**: All image paths are prefixed with `/blog/` for GitHub Pages deployment
- **Dev.to cross-publishing**: Image URLs are absolutized using `BLOG_PUBLIC_BASE_URL` environment variable

Key functions:
- `normalizePublicBaseUrl()`: Ensures trailing slash for proper URL handling
- `absolutizeSrc()`: Converts relative image paths to absolute URLs for external platforms
- `parseMarkdown()`: Handles image path normalization for local rendering

### Dev.to Integration
The `scripts/post-to-dev.js` automates publishing to Dev.to:
- Converts front matter to Dev.to API format
- Absolutizes image URLs for proper rendering on Dev.to
- Handles tag sanitization (max 4 tags, alphanumeric only)
- Sets canonical_url to point back to original blog post
- Creates drafts by default (published: false)

Environment variables required:
- `DEVTO_API_KEY`: Your Dev.to API key
- `BLOG_PUBLIC_BASE_URL`: Public base URL (defaults to https://wintrover.github.io/blog/)

### Deployment Configuration
- **Base path**: `/blog/` (configured in vite.config.js)
- **Output directory**: `dist/`
- **GitHub Actions**: Automatic deployment on push to main branch
- **Node version**: 18 (specified in GitHub Actions workflow)

### Front Matter Schema
Posts use YAML front matter with these fields:
```yaml
title: "Post Title"
date: "2025-01-15"
category: "webdev"
tags: ["javascript", "svelte", "vite"]
excerpt: "Brief description of the post"
cover_image: "/blog/assets/images/posts/cover.jpg"
canonical_url: "https://wintrover.github.io/blog/#/post/slug"
```

### Development Notes
- The project uses ES modules (`"type": "module"` in package.json)
- Vite's raw loading for markdown files enables dynamic post discovery
- Custom test runner uses Node.js built-in assert module
- SPA routing with hash-based navigation (`/#/post/slug`)
- Component-scoped CSS with no preprocessor