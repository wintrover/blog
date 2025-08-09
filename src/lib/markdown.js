import { marked } from 'marked'

// 마크다운 파일 경로 매핑
const postFiles = {
  'how-i-built-cvfactory': '/blog/_posts/2025-06-25-1.md',
  'cvfactory-backend-celery-fastapi-playwright': '/blog/_posts/2025-06-29-2.md',
  'svelte-django-practical-checklist': '/blog/_posts/2025-07-01-3.md',
  'sonarqube-community-edition-grade-a-quality': '/blog/_posts/2025-07-06-4.md',
  'junior-developer-google-login-implementation': '/blog/_posts/2025-07-18-5.md',
  'facial-authentication-system-development': '/blog/_posts/2025-08-05-6.md'
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

// 코드 블록 렌더러 커스터마이징
renderer.code = function(code, language) {
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