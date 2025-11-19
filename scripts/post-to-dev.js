import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { processMermaidDiagrams } from './mermaid-to-image.js';

// BASE URL 정규화: 디렉터리로 인식되도록 반드시 트레일링 슬래시를 유지
function normalizePublicBaseUrl(url) {
  try {
    if (typeof url !== 'string' || !url) return 'https://wintrover.github.io/blog';
    const trimmed = url.trim().replace(/['"]/g, '');
    // 이미 프로토콜 포함 URL만 허용
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed.replace(/^\/*/, '')}`);
    // 디렉터리로 인식되도록 트레일링 슬래시 강제
    if (!u.pathname.endsWith('/blog')) {
      // /blog로 끝나지 않으면 추가
      if (u.pathname === '/') {
        u.pathname = '/blog/';
      } else if (!u.pathname.includes('/blog')) {
        u.pathname = (u.pathname.replace(/\/$/, '')) + '/blog/';
      } else {
        // 이미 /blog가 있는 경로는 그대로 유지
      }
    }
    // 최종적으로 디렉터리 경로로 인식되도록 반드시 슬래시 유지
    if (!u.pathname.endsWith('/')) {
      u.pathname = u.pathname + '/';
    }
    return u.toString();
  } catch {
    // 실패 시 안전한 기본값
    return 'https://wintrover.github.io/blog';
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

    // Check for UCloud temporary URLs and return them as-is for now
    // These need manual handling as they're temporary and signed
    if (trimmed.includes('ufileos.com') ||
        trimmed.includes('UCloudPublicKey') ||
        trimmed.includes('signature=') ||
        trimmed.includes('Expires=')) {
      console.warn(`⚠️ UCloud temporary URL detected: ${trimmed.substring(0, 100)}...`);
      console.warn('   This URL may not render on Dev.to. Consider downloading and hosting the image publicly.');
      return trimmed;
    }

    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;

    const baseUrl = normalizePublicBaseUrl(publicBaseUrl);
    const base = new URL(baseUrl);
    const underBlog = base.pathname.replace(/\/+$/, '').endsWith('/blog');

    // Fast-path for already-flat images path
    if (/^(?:public\/)?images\//.test(trimmed) || /^(?:\/)(?:public\/)?images\//.test(trimmed) || /^blog\/images\//.test(trimmed) || /^\/blog\/images\//.test(trimmed)) {
      // Remove 'public/' prefix if present
      let assetPath = trimmed;
      if (assetPath.startsWith('public/')) {
        assetPath = assetPath.substring(7);
      }
      // Ensure proper path formatting
      assetPath = assetPath.replace(/\\/g, '/');
      // Remove leading slash to avoid double slashes in URL construction
      assetPath = assetPath.replace(/^\//, '');
      // Remove 'blog/' prefix if already in base pathname to avoid duplication
      if (assetPath.startsWith('blog/')) {
        assetPath = assetPath.substring(5);
      }
      // Construct proper URL by joining base pathname with asset path
      const basePath = base.pathname.replace(/\/$/, ''); // Remove trailing slash
      const abs = `${base.origin}${basePath}/${assetPath}`;
      return abs;
    }

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

    // Flatten legacy assets/images to images flat folder
    if (/^assets\/images\//i.test(assetPath)) {
      const rest = assetPath.replace(/^assets\/images\//i, '');
      const parts = rest.split('/');
      if (parts.length >= 2 && /^\d{2}$/.test(parts[0])) {
        assetPath = `images/${parts[0]}-${parts.slice(1).join('/')}`;
      } else {
        assetPath = `images/${parts.slice(1).join('/') || parts[0]}`;
      }
    }

    const useRaw = String(process.env.BLOG_IMAGE_ABS_MODE || '').toLowerCase() === 'raw';
    const ghRepo = process.env.GITHUB_REPOSITORY; // owner/repo in GitHub Actions
    if (useRaw && ghRepo) {
      let repoPath = assetPath.replace(/^\/+/, '');
      if (!repoPath.startsWith('public/')) {
        repoPath = `public/${repoPath}`;
      }
      return `https://raw.githubusercontent.com/${ghRepo}/refs/heads/main/${repoPath}`;
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

export async function absolutizeImagesInMarkdown(markdown, publicBaseUrl, firstImageRef) {
  if (typeof markdown !== 'string') return markdown;
  let out = markdown;

  // HTML <img ...> tags
  out = out.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*)>/gi, async (m, pre, src, post) => {
    let abs = src;
    if (isUCloudUrl(src)) {
      console.log(`🔄 Processing UCloud image: ${src.substring(0, 80)}...`);
      abs = await downloadAndHostUCloudImage(src, publicBaseUrl);
      console.log(`✅ Converted to: ${abs}`);
    } else {
      abs = absolutizeSrc(src, publicBaseUrl);
    }
    if (!firstImageRef.url) firstImageRef.url = abs;
    return `<img ${pre}src="${abs}"${post}>`;
  });

  // Markdown images ![alt](url "title")
  const markdownImageRegex = /!\[([^\]]*)\]\((\s*<?([^)\s]+)>?)([^)]*)\)/g;
  const matches = [...markdown.matchAll(markdownImageRegex)];

  for (const match of matches) {
    const [fullMatch, alt, urlPart, urlOnly, rest] = match;
    let abs = urlOnly;

    if (isUCloudUrl(urlOnly)) {
      console.log(`🔄 Processing UCloud image: ${urlOnly.substring(0, 80)}...`);
      abs = await downloadAndHostUCloudImage(urlOnly, publicBaseUrl);
      console.log(`✅ Converted to: ${abs}`);
    } else {
      abs = absolutizeSrc(urlOnly, publicBaseUrl);
    }

    if (!firstImageRef.url) firstImageRef.url = abs;
    const restOut = rest || '';
    out = out.replace(fullMatch, `![${alt}](${abs}${restOut})`);
  }

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

    console.log('🔄 Processing Mermaid diagrams...');
    const mermaidOutputDir = path.join('public', 'images');
    const baseName = path.basename(filePath, path.extname(filePath));
    const m = baseName.match(/^(\d{4}-\d{2}-\d{2})(?:-(\d+))?/);
    const datePart = (m && m[1]) || (frontmatter.date || '').toString();
    const numPart = (m && m[2]) || '0';
    const filenameBase = `${datePart}-${numPart}`;
    const { content: processedContent, images: mermaidImages } = await processMermaidDiagrams(
      content,
      publicBaseUrl,
      mermaidOutputDir,
      filenameBase
    );

    if (mermaidImages.length > 0) {
      console.log(`✅ Successfully converted ${mermaidImages.length} Mermaid diagram(s) to images`);
      mermaidImages.forEach(img => {
        console.log(`   📊 ${img.filename} -> ${img.url}`);
      });
    } else {
      console.log('ℹ️  No Mermaid diagrams found in content');
    }

    // Absolutize image URLs for dev.to rendering
    const firstImageRef = { url: null };
    const bodyMarkdown = await absolutizeImagesInMarkdown(processedContent, publicBaseUrl, firstImageRef);

    // canonical_url to original blog post
    const slug = slugifyTitle(frontmatter.title || path.basename(filePath, path.extname(filePath)));
    const canonicalUrl = frontmatter.canonical_url || `${publicBaseUrl}#/post/${slug}`;

    // dev.to title length limit: 128 chars for full_post
    const clampTitle = (t) => {
      if (!t) return ''
      return t.length <= 128 ? t : (t.slice(0, 125) + '...')
    }

    const article = {
      title: clampTitle(frontmatter.title),
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

// Utility function to download and host UCloud images
async function downloadAndHostUCloudImage(ucloudUrl, publicBaseUrl) {
  try {
    const crypto = await import('crypto');

    // Extract filename from URL or generate one
    const urlHash = crypto.createHash('md5').update(ucloudUrl).digest('hex');
    const filename = `ucloud-${urlHash}.png`;
    const outputPath = path.join('public', 'images', filename);

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Download image
    const response = await fetch(ucloudUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(buffer));

    // Return GitHub raw URL instead of GitHub Pages URL
    // Get git remote URL to determine the correct raw URL format
    const gitRemote = await getGitHubRepoInfo();
    if (gitRemote) {
      const { owner, repo } = gitRemote;
      // Use GitHub's raw content URL
      const normalizedPath = `public/images/${filename}`.replace(/\\/g, '/');
      return `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main/${normalizedPath}`;
    }

    // Fallback to GitHub Pages URL if git info not available
    const baseUrl = normalizePublicBaseUrl(publicBaseUrl);
    return `${baseUrl}/images/${filename}`;
  } catch (error) {
    console.error('Failed to process UCloud image:', error.message);
    return ucloudUrl; // Fallback to original URL
  }
}

// Get GitHub repository info from git remote
async function getGitHubRepoInfo() {
  try {
    const { exec } = await import('child_process');
    const util = await import('util');
    const execAsync = util.promisify(exec);

    // Get remote URL
    const { stdout: remoteUrl } = await execAsync('git remote get-url origin');

    // Parse GitHub URL
    const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(\.git)?/i);
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Function to check if a URL is a UCloud temporary URL
function isUCloudUrl(url) {
  return url.includes('ufileos.com') ||
         url.includes('UCloudPublicKey') ||
         url.includes('signature=') ||
         url.includes('Expires=');
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