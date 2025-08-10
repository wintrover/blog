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
function parseMarkdown(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontMatterRegex)
  
  if (!match) {
    return {
      frontMatter: {},
      html: marked(content)
    }
  }
  
  const [, frontMatterStr, markdownContent] = match
  const frontMatter = parseFrontMatter(frontMatterStr)
  const html = marked(markdownContent)
  
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

// 이미지 렌더러 커스터마이징 - 상대 경로를 절대 경로로 변환
renderer.image = function(href, title, text) {
  // 상대 경로인 경우 절대 경로로 변환
  if (href.startsWith('../')) {
    href = href.replace('../', '/blog/')
  }
  
  let out = `<img src="${href}" alt="${text}"`
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