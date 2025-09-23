import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// BASE URL 정규화: 디렉터리로 인식되도록 반드시 트레일링 슬래시를 유지
function normalizePublicBaseUrl(url) {
  try {
    if (typeof url !== 'string' || !url) return 'https://wintrover.github.io/blog/';
    const trimmed = url.trim().replace(/['"]/g, '');
    // 이미 프로토콜 포함 URL만 허용
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed.replace(/^\/*/, '')}`);
    // 디렉터리로 인식되도록 트레일링 슬래시 강제
    if (!u.pathname.endsWith('/')) u.pathname = u.pathname + '/';
    return u.toString();
  } catch {
    // 실패 시 안전한 기본값
    return 'https://wintrover.github.io/blog/';
  }
}

function slugifyTitle(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function absolutizeSrc(src, publicBaseUrl) {
  try {
    if (typeof src !== 'string' || !src) return src;
    const trimmed = src.trim().replace(/^['"]|['"]$/g, '');
    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;

    const baseUrl = normalizePublicBaseUrl(publicBaseUrl);
    const base = new URL(baseUrl);
    const underBlog = base.pathname.replace(/\/+$/, '').endsWith('/blog');

    // Derive asset path under assets/images
    let assetPath = trimmed;
    const mBlogAssets = trimmed.match(/(?:^|\/)(blog\/assets\/[^?#\s)]+)/i);
    const mAssets = trimmed.match(/(?:^|\/)(assets\/[^?#\s)]+)/i);
    const mImages = trimmed.match(/(?:^|\/)(images\/[^?#\s)]+)/i);
    if (mBlogAssets) {
      assetPath = mBlogAssets[1].replace(/^blog\//i, '');
    } else if (mAssets) {
      assetPath = mAssets[1];
    } else if (mImages) {
      assetPath = mImages[1];
    } else {
      assetPath = trimmed.replace(/^\.{1,2}\//, '').replace(/^blog\//i, '');
    }

    let p;
    if (underBlog) {
      // relative to /blog
      p = assetPath.replace(/^\/+/, '');
    } else {
      // absolute under root /blog
      p = '/blog/' + assetPath.replace(/^\/+/, '');
    }

    const abs = new URL(p, base).toString();
    return abs;
  } catch {
    return src;
  }
}

export function absolutizeImagesInMarkdown(markdown, publicBaseUrl, firstImageRef) {
  if (typeof markdown !== 'string') return markdown;
  let out = markdown;

  // HTML <img ...> tags
  out = out.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*)>/gi, (m, pre, src, post) => {
    const abs = absolutizeSrc(src, publicBaseUrl);
    if (!firstImageRef.url) firstImageRef.url = abs;
    return `<img ${pre}src="${abs}"${post}>`;
  });

  // Markdown images ![alt](url "title")
  out = out.replace(/!\[([^\]]*)\]\((\s*<?([^)\s]+)>?)([^)]*)\)/g, (m, alt, urlPart, urlOnly, rest) => {
    const abs = absolutizeSrc(urlOnly, publicBaseUrl);
    if (!firstImageRef.url) firstImageRef.url = abs;
    const restOut = rest || '';
    return `![${alt}](${abs}${restOut})`;
  });

  return out;
}

async function postToDev(filePath) {
  const devtoApiKey = process.env.DEVTO_API_KEY;
  const publicBaseUrlRaw = process.env.BLOG_PUBLIC_BASE_URL || 'https://wintrover.github.io/blog';
  const publicBaseUrl = normalizePublicBaseUrl(publicBaseUrlRaw);

  if (!devtoApiKey) {
    console.error('DEVTO_API_KEY is not set.');
    process.exit(1);
  }

  try {
    const markdownWithMeta = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(markdownWithMeta);

    // Normalize and limit tags to DEV's expected constraints (max 4)
    const rawTags = frontmatter.tags;
    const normalizedTags = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === 'string'
      ? rawTags.split(/[\,\s]+/).filter(Boolean)
      : [];

    // Sanitize: lowercase, remove non-alphanumeric, dedupe, drop empty
    const sanitized = Array.from(
      new Set(
        normalizedTags
          .map((t) => String(t).toLowerCase().replace(/[^a-z0-9]/g, ''))
          .filter(Boolean)
      )
    );
    const tags = sanitized.slice(0, 4);

    // Absolutize image URLs for dev.to rendering
    const firstImageRef = { url: null };
    const bodyMarkdown = absolutizeImagesInMarkdown(content, publicBaseUrl, firstImageRef);

    // canonical_url to original blog post
    const slug = slugifyTitle(frontmatter.title || path.basename(filePath, path.extname(filePath)));
    const canonicalUrl = frontmatter.canonical_url || `${publicBaseUrl}#/post/${slug}`;

    const article = {
      title: frontmatter.title,
      published: false,
      body_markdown: bodyMarkdown,
      tags,
      description: frontmatter.excerpt || frontmatter.description || undefined,
      canonical_url: canonicalUrl,
      cover_image: frontmatter.cover_image || firstImageRef.url || undefined,
    };

    const response = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.forem.api-v1+json',
        'api-key': devtoApiKey,
      },
      body: JSON.stringify({ article }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`Successfully created draft: ${result.url}`);
    } else {
      const error = await response.json();
      console.error('Failed to create draft:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

// CLI 실행 가드: 직접 실행일 때만 동작
if (process.argv[1] && path.basename(process.argv[1]) === 'post-to-dev.js') {
  const postFilePath = process.argv[2];
  if (!postFilePath) {
    console.error('Please provide a path to a markdown file.');
    process.exit(1);
  }
  postToDev(path.resolve(postFilePath));
}