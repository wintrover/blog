import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

function slugifyTitle(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function absolutizeSrc(src, publicBaseUrl) {
  try {
    if (typeof src !== 'string' || !src) return src;
    const trimmed = src.trim().replace(/^['"]|['"]$/g, '');
    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;

    const basePath = '/blog';
    let p = trimmed;
    // normalize common variants to site-rooted paths under /blog
    if (p.startsWith('/blog/')) {
      // already rooted under /blog
    } else if (p.startsWith('/assets/')) {
      p = basePath + p;
    } else if (p.startsWith('/images/')) {
      p = basePath + p;
    } else if (p === '/favicon.ico') {
      p = basePath + p;
    } else if (p.startsWith('../assets/')) {
      p = basePath + p.replace(/^\.\.\//, '');
    } else if (p.startsWith('./assets/')) {
      p = basePath + p.replace(/^\.\//, '');
    } else if (p.startsWith('assets/')) {
      p = basePath + '/' + p;
    } else if (p.startsWith('images/')) {
      p = basePath + '/' + p;
    } else if (!p.startsWith('/')) {
      // generic relative like test.jpg
      p = basePath + '/' + p;
    }

    // If path starts with just '/something' (e.g. '/assets/...'), ensure it is under /blog
    if (/^\/(?!blog\/)/.test(p)) {
      p = basePath + p;
    }

    const abs = new URL(p, publicBaseUrl).toString();
    // avoid accidental double slashes except protocol
    return abs.replace(/([^:]\/)\/+/, '$1/');
  } catch {
    return src; // do not break posting on edge inputs
  }
}

function absolutizeImagesInMarkdown(markdown, publicBaseUrl, firstImageRef) {
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
  const publicBaseUrl = process.env.BLOG_PUBLIC_BASE_URL || 'https://wintrover.github.io/blog';

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

const postFilePath = process.argv[2];
if (!postFilePath) {
  console.error('Please provide a path to a markdown file.');
  process.exit(1);
}

postToDev(path.resolve(postFilePath));