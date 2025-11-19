import { marked } from 'marked'
import mermaid from 'mermaid'

// 마크다운 파일 경로 매핑
// ⚠️ 새 포스트 추가 시 여기에 slug: 파일경로 매핑을 추가해야 함!
// posts.js의 postsData와 함께 업데이트 필수!
const postFiles = {
  'how-i-built-cvfactory': '/blog/_posts/2025-06-25-1.md',
  'cvfactory-backend-celery-fastapi-playwright': '/blog/_posts/2025-06-29-2.md',
  'svelte-django-practical-checklist': '/blog/_posts/2025-07-01-3.md',
  'sonarqube-community-edition-grade-a-quality': '/blog/_posts/2025-07-06-4.md',
  'junior-developer-google-login-implementation': '/blog/_posts/2025-07-18-5.md',
  'facial-authentication-system-development': '/blog/_posts/2025-08-05-6.md',
  'kyc-system-completion-and-growth': '/blog/_posts/2025-08-10-7.md'
}

// 런타임 BASE 경로 (Vite 제공). 테스트/노드 환경에선 '/blog/'로 폴백
const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
  ? import.meta.env.BASE_URL
  : '/blog/'

function joinBase(p) {
  return `${BASE.replace(/\/$/, '')}/${String(p).replace(/^\//, '')}`
}

// 이미지 경로 정규화
export function normalizeImageSrc(src) {
  if (!src || typeof src !== 'string') return src
  
  // 1) 원격 URL과 data URI는 그대로 유지
  if (/^(https?:\/\/|data:)/i.test(src)) return src

  // 2) 이전 하드코딩 '/blog/'를 현재 BASE로 동기화
  if (src.startsWith('/blog/')) {
    const rest = src.slice('/blog/'.length)
    // handle legacy assets/images -> images flat
    if (rest.startsWith('assets/images/')) {
      const flattened = flattenLegacyAssetsPath(rest)
      return joinBase(flattened)
    }
    return joinBase(rest)
  }

  // 3) 이미 BASE로 시작하면 그대로
  if (src.startsWith(BASE)) return src

  // 4) 절대 경로 중 /assets/images/* 는 images 평면으로 변환
  if (src.startsWith('/assets/images/')) {
    const flattened = flattenLegacyAssetsPath(src.slice(1))
    return joinBase(flattened)
  }
  // 5) 절대 경로 /images/* -> BASE 접두
  if (src.startsWith('/images/')) {
    return joinBase(src.slice(1))
  }

  // 6) 상대 경로 내 assets 포함 (../assets, ./assets 등)
  const mRelAssetsImages = src.match(/(^|\/?)(?:\.\.\/|\.\/)?assets\/images\/(.+)$/)
  if (mRelAssetsImages) {
    const flattened = flattenLegacyAssetsPath(`assets/images/${mRelAssetsImages[2]}`)
    return joinBase(flattened)
  }

  // 7) 기타 상대경로 (예: images/...) -> BASE 접두
  return joinBase(src)
}

function flattenLegacyAssetsPath(p) {
  // input like 'assets/images/<dir>/<filename>' or 'assets/images/<filename>'
  const rest = p.replace(/^assets\/images\//, '')
  const parts = rest.split('/')
  if (parts.length >= 2) {
    const first = parts[0]
    const filename = parts.slice(1).join('/')
    if (/^\d{2}$/.test(first)) {
      return `images/${first}-${filename}`
    }
    return `images/${filename}`
  }
  return `images/${rest}`
}

// 마크다운 파일 로드 및 파싱
export async function loadPost(slug) {
  const filePath = postFiles[slug]
  if (!filePath) {
    return null
  }
  
  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}`)
    }
    
    const content = await response.text()
    return parseMarkdown(content)
  } catch (error) {
    console.error('Error loading post:', error)
    return null
  }
}

// 마크다운 파싱 (front matter + content)
export function parseMarkdown(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontMatterRegex)
  
  if (!match) {
    const htmlRaw = marked(content)
    return {
      frontMatter: {},
      html: htmlRaw.replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/g, (m, src) => {
        const fixed = normalizeImageSrc(src)
        return m.replace(src, fixed)
      })
    }
  }
  
  const [, frontMatterStr, markdownContent] = match
  const frontMatter = parseFrontMatter(frontMatterStr)
  const htmlRaw = marked(markdownContent)
  const html = htmlRaw.replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/g, (m, src) => {
    const fixed = normalizeImageSrc(src)
    return m.replace(src, fixed)
  })
  
  return {
    frontMatter,
    html
  }
}

// Front matter 파싱
function parseFrontMatter(str) {
  const lines = str.split('\n')
  const result = {}
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()
      
      // 따옴표 제거
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      
      // 태그 배열 처리
      if (key === 'tags' && value.includes(' ')) {
        result[key] = value.split(' ').map(tag => tag.trim())
      } else {
        result[key] = value
      }
    }
  }
  
  return result
}

// 마크다운 렌더러 설정
const renderer = new marked.Renderer()

// Mermaid 초기화 (브라우저에서만)
if (typeof window !== 'undefined') {
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose'
    })
  } catch (e) {
    // 예외 상황에서만 로깅
    console.error('Mermaid init error:', e)
  }
}

// 이미지 렌더러 커스터마이징 - 모든 경로 정규화
renderer.image = function(href, title, text) {
  const normalized = normalizeImageSrc(href)
  let out = `<img src="${normalized}" alt="${text}"`
  if (title) {
    out += ` title="${title}"`
  }
  out += ' />'
  return out
}

// 코드 블록 렌더러 커스터마이징
renderer.code = function(code, language) {
  // Mermaid 다이어그램 처리
  if (language === 'mermaid') {
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
    return `<div class="mermaid-diagram" data-mermaid-code="${encodeURIComponent(code)}" id="${id}">${code}</div>`
  }
  
  // 일반 코드 블록 처리
  const escapedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
  
  const buttonsContainer = `
    <div class="devsite-code-buttons-container" role="group" aria-label="Action buttons">
      <button type="button" class="devsite-icon-theme-toggle" aria-label="Toggle theme" data-title="Toggle theme"></button>
      <button type="button" class="devsite-icon-copy" aria-label="Copy code sample" data-title="Copy code sample"></button>
    </div>
  `
  
  return `<pre>${buttonsContainer}<code${language ? ` class="language-${language}"` : ''}>${escapedCode}</code></pre>`
}

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer: renderer
})