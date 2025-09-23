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

// 이미지 경로 정규화
function normalizeImageSrc(src) {
  if (!src || typeof src !== 'string') return src
  // 절대 경로는 그대로 유지
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  // vite base가 /blog/이므로, /assets로 시작하면 /blog/assets로 보정
  if (src.startsWith('/assets/')) return `/blog${src}`
  // ../assets 또는 ../../assets -> /blog/assets로 변환
  if (src.includes('/assets/')) {
    const idx = src.indexOf('/assets/')
    return `/blog${src.slice(idx)}`
  }
  // 상대경로 "../" -> "/blog/"로 변환
  if (src.startsWith('../')) return src.replace(/^\.\.+\//, '/blog/')
  // 루트가 아닌 상대경로인 경우(예: images/09/..), /blog/를 앞에 추가
  if (!src.startsWith('/')) return `/blog/${src.replace(/^\.\//, '')}`
  // 이미 /blog/로 시작하지 않는 절대 루트 경로는 /blog를 접두사로 추가
  if (src.startsWith('/')) return src.startsWith('/blog/') ? src : `/blog${src}`
  return src
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

// Mermaid 초기화
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose'
})

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
    .replace(/"/g, '&quot;')
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