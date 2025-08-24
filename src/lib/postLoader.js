import { marked } from 'marked';

// 간단한 front matter 파서
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return {
      data: {},
      content: content
    };
  }
  
  const frontMatter = match[1];
  const body = match[2];
  
  // YAML 파싱 (간단한 버전)
  const data = {};
  const lines = frontMatter.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
        
        // 값이 문자열인지 숫자인지 확인
        if (key === 'tags') {
          // tags는 공백으로 구분된 문자열이므로 배열로 변환
          data[key] = value.split(' ');
        } else if (value.startsWith('"') && value.endsWith('"')) {
          data[key] = value.slice(1, -1);
        } else if (value === 'true') {
          data[key] = true;
        } else if (value === 'false') {
          data[key] = false;
        } else if (!isNaN(value)) {
          data[key] = Number(value);
        } else {
          data[key] = value;
        }
      }
    }
  }
  
  return {
    data: data,
    content: body
  };
}

// 제목을 slug로 변환하는 함수
function slugifyTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈 제거
    .trim();
}

// 모든 포스트를 동적으로 로드하는 함수
export async function loadAllPosts() {
  try {
    // Vite의 import.meta.glob을 사용하여 모든 .md 파일을 동적으로 로드
    const modules = import.meta.glob('../posts/*.md', { eager: true, query: '?raw', import: 'default' });
    
    console.log('loadAllPosts - 로드된 모듈:', Object.keys(modules));
    
    const posts = [];
    
    for (const path in modules) {
      const content = modules[path];
      const fileName = path.split('/').pop().replace('.md', '');
      
      // parseFrontMatter로 front matter와 content 분리
      const { data, content: markdownContent } = parseFrontMatter(content);
      
      // front matter가 없는 경우 기본값 설정
      const post = {
        fileName: fileName,
        slug: slugifyTitle(data.title || fileName),
        title: data.title || fileName,
        date: data.date || new Date().toISOString().split('T')[0],
        category: data.category || 'general',
        tags: data.tags || [],
        excerpt: data.excerpt || '',
        content: markdownContent,
        ...data // 다른 front matter 데이터 추가
      };
      
      posts.push(post);
    }
    
    // 날짜순으로 정렬 (최신 포스트가 먼저)
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('포스트 로딩 중 오류 발생:', error);
    return [];
  }
}

// 특정 slug로 포스트를 로드하는 함수
export async function loadPostBySlug(slug) {
  try {
    // Vite의 import.meta.glob을 사용하여 모든 .md 파일을 동적으로 로드
    const modules = import.meta.glob('../posts/*.md', { eager: true, query: '?raw', import: 'default' });
    
    console.log('로드된 모듈:', Object.keys(modules));
    console.log('요청된 slug:', slug);
    
    // 모든 파일을 순회하며 slug가 일치하는 포스트를 찾음
    let targetContent = null;
    let targetData = null;
    let targetFileName = null;
    
    for (const path in modules) {
      const content = modules[path];
      const fileName = path.split('/').pop().replace('.md', '');
      
      // parseFrontMatter로 front matter와 content 분리
      const { data, content: markdownContent } = parseFrontMatter(content);
      
      // 제목을 기반으로 slug 생성
      const postSlug = slugifyTitle(data.title || fileName);
      
      console.log(`파일: ${fileName}, 제목: ${data.title || fileName}, 생성된 slug: ${postSlug}`);
      
      if (postSlug === slug) {
        targetContent = content;
        targetData = data;
        targetFileName = fileName;
        break;
      }
    }
    
    console.log('찾은 파일명:', targetFileName);
    console.log('파일 내용 존재:', !!targetContent);
    
    if (!targetContent) {
      console.log('파일을 찾을 수 없습니다. 사용 가능한 파일들:', Object.keys(modules));
      return null;
    }
    
    // parseFrontMatter로 front matter와 content 분리
    const { data, content: markdownContent } = parseFrontMatter(targetContent);
    
    // marked로 markdown을 HTML로 변환
    const htmlContent = marked(markdownContent);
    
    return {
      fileName: targetFileName,
      slug: slug,
      title: data.title || targetFileName,
      date: data.date || new Date().toISOString().split('T')[0],
      category: data.category || 'general',
      tags: data.tags || [],
      excerpt: data.excerpt || '',
      content: markdownContent,
      html: htmlContent,
      ...data // 다른 front matter 데이터 추가
    };
  } catch (error) {
    console.error(`포스트 로딩 중 오류 발생 (${slug}):`, error);
    return null;
  }
}