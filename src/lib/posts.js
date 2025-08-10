// Real post data extracted from markdown files (sorted by date descending)
// ⚠️ 새 포스트 추가 시 주의사항:
// 1. 이 파일의 postsData 배열에 메타데이터 추가 (날짜 순서대로)
// 2. markdown.js의 postFiles 객체에 slug와 파일 경로 매핑 추가
// 3. 두 작업을 모두 해야 블로그에서 포스트가 보임!
export const postsData = [
  {
    title: "Junior Developer's Full-Stack AI Journey: Completing the KYC System and Growing",
    date: "2025-08-10",
    category: "Company Work",
    tags: ["kyc", "facial-recognition", "ffmpeg", "mariadb", "mediapipe"],
    slug: "kyc-system-completion-and-growth",
    excerpt: "Based on the Yaw angle measurement technology resolved in the last post, I completed the core functions of the KYC system. From video splitting using FFmpeg and MariaDB integration to performance optimization - I share a junior developer's full-stack challenge."
  },
  {
    title: "As a New Hire, I'm Leading the Company Platform's Facial Authentication System Development",
    date: "2025-08-05",
    category: "Company Work",
    tags: ["facial-recognition", "authentication", "deepface", "mediapipe"],
    slug: "facial-authentication-system-development",
    excerpt: "I've been tasked with developing a facial recognition-based user authentication system for the company platform, working independently on this critical project. This goes beyond simple feature development, encompassing real-time processing and multi-environment adaptation."
  },
  {
    title: "A Junior Developer's First Google Login Implementation: A Practical Guide Through Trial and Error",
    date: "2025-07-18",
    category: "Project",
    tags: ["svelte", "oauth", "google", "authentication", "junior-developer"],
    slug: "junior-developer-google-login-implementation",
    excerpt: "While working on a side project, I thought, 'Why not add a Google login feature?' Little did I know how much of a learning journey this thought would become. From my first encounter with OAuth 2.0, I learned so much through trial and error."
  },
  {
    title: "Implementing SonarQube Community Edition in My Repository - Achieving Grade A Code Quality Locally",
    date: "2025-07-06",
    category: "Project",
    tags: ["sonarqube", "docker", "python", "svelte"],
    slug: "sonarqube-community-edition-grade-a-quality",
    excerpt: "Code quality management is essential for developers. Maintaining consistent quality standards in a Svelte + Django monorepo project requires static analysis tools. This post shares our journey of setting up SonarQube Community Edition locally."
  },
  {
    title: "Do I Really Need Svelte in My Django Project? — A Practical Checklist I Wrote After Comparing Vanilla JS vs. Frameworks",
    date: "2025-07-01",
    category: "Project",
    tags: ["svelte", "javascript", "django", "architecture"],
    slug: "svelte-django-practical-checklist",
    excerpt: "While adding features like a hamburger menu, OAuth login, and per-user settings to a side project, I started to feel the limits of plain HTML/CSS/JavaScript. This post distills a hands-on checklist for balancing framework benefits against resource constraints."
  },
  {
    title: "Behind CVFactory's Backend: Celery, FastAPI, and Playwright at Scale",
    date: "2025-06-29",
    category: "Project",
    tags: ["ai", "backend", "celery", "fastapi", "playwright", "python"],
    slug: "cvfactory-backend-celery-fastapi-playwright",
    excerpt: "In this follow-up post I'll lift the hood on CVFactory's backend - the directory you can find at @/Backend in the repo. The service may look small, but it orchestrates a surprising amount of moving parts."
  },
  {
    title: "How I Built CVFactory: Deploying an AI Cover-Letter Generator with Django & Docker",
    date: "2025-06-25",
    category: "Project",
    tags: ["ai", "django", "docker", "career"],
    slug: "how-i-built-cvfactory",
    excerpt: "In this post, I'll walk you through my recent side project CVFactory—a web service that accepts a job posting and your career history, then leverages AI to generate a tailored cover-letter draft."
  }
]