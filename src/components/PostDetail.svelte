<script lang="ts">
import mermaid from "mermaid";
import { afterUpdate, onMount } from "svelte";
import { push } from "svelte-spa-router";
import { loadPostBySlug } from "../lib/postLoader";
import { formatDate, slugify } from "../lib/utils";
import Comments from "./Comments.svelte";

// Browser detection
const browser = typeof window !== "undefined";

export const params = {};
let post = null;
let markdownContent = null;
let loading = true;

let currentSlug = null;

async function loadPostData(slug: string) {
	if (!slug) return;
	if (currentSlug === slug) return;

	currentSlug = slug;
	loading = true;

	try {
		// 포스트 데이터 로드
		const postData = await loadPostBySlug(slug);

		if (!postData) {
			throw new Error(`포스트를 찾을 수 없습니다. (slug: ${slug})`);
		}

		post = postData;
		markdownContent = postData;
		loading = false;

		// Update page title and meta tags
		if (browser && post) {
			document.title = `${post.title} - wintrover`;

			// Update or create meta tags
			updateMetaTag("og:title", post.title);
			updateMetaTag("og:url", window.location.href);
			updateMetaTag("og:description", post.excerpt || post.title);
			updateMetaTag("description", post.excerpt || post.title);

			// Update canonical URL
			updateLinkTag("canonical", window.location.href);
		}

		// 버튼 이벤트 리스너 추가
		setTimeout(() => {
			setupCodeBlockButtons();
		}, 500);
	} catch (error) {
		console.error("❌ [PostDetail] 포스트 데이터 로딩 중 에러 발생:", {
			slug,
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : "Stack trace unavailable",
			error,
		});
		loading = false;
	}
}

function updateMetaTag(property, content) {
	let meta =
		document.querySelector(`meta[property="${property}"]`) ||
		document.querySelector(`meta[name="${property}"]`);

	if (!meta) {
		meta = document.createElement("meta");
		meta.setAttribute(property.includes("og:") ? "property" : "name", property);
		document.head.appendChild(meta);
	}

	meta.setAttribute("content", content);
}

function updateLinkTag(rel, href) {
	let link = document.querySelector(`link[rel="${rel}"]`);

	if (!link) {
		link = document.createElement("link");
		link.setAttribute("rel", rel);
		document.head.appendChild(link);
	}

	link.setAttribute("href", href);
}

onMount(() => {
	if (params?.slug) {
		loadPostData(params.slug);
	}
});

$: if (params?.slug) {
	loadPostData(params.slug);
}

afterUpdate(() => {
	if (!loading && markdownContent) {
		setTimeout(async () => {
			setupCodeBlockButtons();
			await setupMermaidDiagrams();
		}, 100);
	}
});

function showCopyToast(codeBlock) {
	// 기존 토스트 제거
	const existingToast = codeBlock.querySelector(".copy-toast");
	if (existingToast) {
		existingToast.remove();
	}

	// 새 토스트 생성
	const toast = document.createElement("div");
	toast.className = "copy-toast";
	toast.textContent = "code has been copied";

	// 코드 블록에 토스트 추가
	codeBlock.appendChild(toast);

	// 애니메이션을 위한 지연
	setTimeout(() => {
		toast.classList.add("show");
	}, 10);

	// 3초 후 제거
	setTimeout(() => {
		toast.classList.remove("show");
		setTimeout(() => {
			if (toast.parentNode) {
				toast.remove();
			}
		}, 300);
	}, 3000);
}

function setupCodeBlockButtons() {
	const codeBlocks = document.querySelectorAll(".markdown-content pre");

	codeBlocks.forEach((pre) => {
		const themeToggle = pre.querySelector(".devsite-icon-theme-toggle");
		const copyButton = pre.querySelector(".devsite-icon-copy");

		if (themeToggle && !themeToggle.hasAttribute("data-listener-added")) {
			themeToggle.setAttribute("data-listener-added", "true");
			themeToggle.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				pre.classList.toggle("dark-theme");
				themeToggle.classList.toggle("light-mode");
			});
		}

		if (copyButton) {
			copyButton.addEventListener("click", () => {
				const code = pre.querySelector("code");
				if (code) {
					const text = code.textContent || code.innerText;
					navigator.clipboard
						.writeText(text)
						.then(() => {
							showCopyToast(pre);
						})
						.catch((err) => {
							console.error("❌ [PostDetail] 클립보드 복사 실패:", {
								message: err instanceof Error ? err.message : String(err),
								stack:
									err instanceof Error ? err.stack : "Stack trace unavailable",
								error: err,
							});
						});
				}
			});
		}
	});
}

async function setupMermaidDiagrams() {
	const mermaidElements = document.querySelectorAll(".mermaid-diagram");

	for (const element of mermaidElements) {
		if (element.hasAttribute("data-rendered")) continue;

		const code = decodeURIComponent(element.getAttribute("data-mermaid-code"));
		const id = element.id;

		try {
			const { svg } = await mermaid.render(`${id}-svg`, code);
			element.innerHTML = svg;
			element.setAttribute("data-rendered", "true");
		} catch (error) {
			console.error("❌ [PostDetail] Mermaid 렌더링 중 에러 발생:", {
				elementId: id,
				mermaidCode: code,
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : "Stack trace unavailable",
				error,
			});
			element.innerHTML =
				'<div class="mermaid-error">Mermaid diagram rendering failed</div>';
			element.setAttribute("data-rendered", "true");
		}
	}
}

function goBack() {
	push("/");
}

void formatDate;
void slugify;
void Comments;
void goBack;
</script>

{#if post}
  <article class="post-detail">
    <header class="post-header">
      <div class="post-meta">
        <span class="date">{formatDate(post.date)}</span>
        <span class="category-badge {slugify(post.category)}">
          {post.category}
        </span>
      </div>
      <h1 class="post-title">{post.title}</h1>
      <div class="post-tags">
        {#each post.tags as tag}
          <span class="tag">#{tag}</span>
        {/each}
      </div>
    </header>

    <div class="post-content">
      {#if loading}
        <div class="loading">
          <p>Loading post content...</p>
        </div>
      {:else if markdownContent}
        <div class="markdown-content">
          {@html markdownContent.html}
        </div>
      {:else}
        <div class="content-error">
          <p><strong>Failed to load post content.</strong></p>
          <p>The markdown file for this post could not be loaded.</p>
        </div>
      {/if}
    </div>

    <footer class="post-footer">
      <button class="back-link" on:click={goBack}>← Back to Blog</button>
    </footer>

    <!-- Comments section -->
    <Comments mapping="specific" term={params.slug} />
  </article>
{:else}
  <div class="post-not-found">
    <h1>Post Not Found</h1>
    <p>The post you're looking for doesn't exist.</p>
    <button class="back-link" on:click={goBack}>← Back to Blog</button>
  </div>
{/if}

<style>
  .post-detail {
    max-width: 800px;
    margin: 0 auto;
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .post-header {
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
  }

  .post-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
  }

  .date {
    color: #666;
    font-size: 14px;
  }

  .category-badge {
    background: #0366d6;
    color: white;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
  }

  .category-badge.project {
    background: #28a745;
  }

  .category-badge.company-work {
    background: #6f42c1;
  }

  .post-title {
    margin: 0 0 20px 0;
    font-size: 32px;
    line-height: 1.2;
    color: #24292e;
  }

  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tag {
    background: #f1f8ff;
    color: #0366d6;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .post-content {
    margin-bottom: 40px;
    line-height: 1.6;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .content-error {
    background: #fff5f5;
    border: 1px solid #fed7d7;
    border-radius: 8px;
    color: #c53030;
  }

  .markdown-content {
    font-size: 16px;
    line-height: 1.7;
  }

  .markdown-content :global(h1),
  .markdown-content :global(h2),
  .markdown-content :global(h3) {
    margin: 30px 0 15px 0;
    color: #24292e;
  }

  .markdown-content :global(h2) {
    font-size: 24px;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }

  .markdown-content :global(h3) {
    font-size: 20px;
  }

  .markdown-content :global(p) {
    margin: 0 0 16px 0;
  }

  .markdown-content :global(img) {
    width: 100%;
    height: auto;
  }

  .markdown-content :global(ul),
  .markdown-content :global(ol) {
    margin: 0 0 16px 0;
    padding-left: 30px;
  }

  .markdown-content :global(li) {
    margin-bottom: 8px;
  }

  .markdown-content :global(code) {
    background: #f1f3f4;
    color: #37474f;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 14px;
    font-family: 'Roboto Mono', 'Courier New', monospace;
  }

  /* Google Developer 사이트 CSS 변수 정의 */
  .markdown-content {
    --devsite-code-buttons-container-right: 40px;
    --devsite-code-margin: 16px -40px;
    --devsite-code-padding-block: 24px;
    --devsite-code-padding-inline: 40px;
    --devsite-code-border: 0;
    --devsite-code-border-radius: 0;
    --devsite-code-button-size: 32px;
    --devsite-code-buttons-toggle-dark-display: inline-block;
    --devsite-code-buttons-toggle-light-display: none;
    --devsite-code-comments-color: #b80672;
    --devsite-code-keywords-color: #1967d2;
    --devsite-code-numbers-color: #c5221f;
    --devsite-code-strings-color: #188038;
    --devsite-code-types-color: #9334e6;
    --devsite-code-background: #f1f3f4;
    --devsite-code-color: #37474f;
    --devsite-var-color: #d01884;
    --devsite-primary-font-family: 'Google Sans', 'Noto Sans', 'Noto Sans JP', 'Noto Sans KR', 'Noto Naskh Arabic', 'Noto Sans Thai', 'Noto Sans Hebrew', 'Noto Sans Bengali', sans-serif;
    --devsite-headline-font-family: 'Google Sans', 'Noto Sans', 'Noto Sans JP', 'Noto Sans KR', 'Noto Naskh Arabic', 'Noto Sans Thai', 'Noto Sans Hebrew', 'Noto Sans Bengali', sans-serif;
  }

  .markdown-content :global(pre) {
    border: var(--devsite-code-border, 0);
    border-radius: var(--devsite-code-border-radius, 0);
    clear: both;
    direction: ltr !important;
    display: block;
    margin: 16px 0;
    min-height: var(--devsite-code-button-size);
    overflow: hidden;
    position: relative;
    background: var(--devsite-code-background);
    color: var(--devsite-code-color);
    padding: var(--devsite-code-padding-block) var(--devsite-code-padding-inline);
    font-family: 'Roboto Mono', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    overflow-x: auto;
    box-sizing: inherit;
    white-space: pre-wrap;
    word-wrap: break-word;
    word-break: break-all;
  }

  .markdown-content :global(.devsite-code-buttons-container) {
    position: absolute;
    right: 10px;
    top: 10px;
    z-index: 1;
    margin: 0;
    padding: 0;
    box-sizing: inherit;
    display: flex;
    gap: 4px;
  }

  .markdown-content :global(.devsite-code-buttons-container button) {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    border-radius: 4px;
    color: #5f6368;
    font-size: 18px;
    line-height: 1;
    transition: background-color 0.2s, color 0.2s;
    margin: 0;
    box-sizing: inherit;
  }

  .markdown-content :global(.devsite-code-buttons-container button:hover) {
    background-color: rgba(95, 99, 104, 0.1);
    color: #202124;
  }

  .markdown-content :global(.devsite-icon-theme-toggle)::before {
    content: '\e3a7'; /* material-symbols:brightness-6-outline */
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 18px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: 'liga';
    font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
  }

  .markdown-content :global(.devsite-icon-copy)::before {
    content: '\e14d'; /* material-symbols:content-copy */
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 18px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: 'liga';
    font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
  }

  /* 다크 테마 스타일 */
  .markdown-content :global(pre.dark-theme) {
    --devsite-code-background: #1e1e1e;
    --devsite-code-color: #d4d4d4;
    background: var(--devsite-code-background);
    color: var(--devsite-code-color);
  }

  .markdown-content :global(pre.dark-theme code) {
    color: var(--devsite-code-color);
  }

  .markdown-content :global(pre code) {
    background: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
    border-radius: 0;
  }

  .markdown-content :global(blockquote) {
    border-left: 4px solid #dfe2e5;
    padding-left: 16px;
    margin: 16px 0;
    color: #6a737d;
  }

  /* 복사 토스트 팝업 스타일 */
  .markdown-content :global(.copy-toast) {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: #2d3748;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
    z-index: 10;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .markdown-content :global(.copy-toast.show) {
    opacity: 1;
    transform: translateY(0);
  }

  .post-footer {
    padding-top: 20px;
    border-top: 1px solid #eee;
  }

  .back-link {
    background: none;
    border: none;
    color: #0366d6;
    cursor: pointer;
    font-weight: 500;
    font-size: inherit;
    padding: 0;
    transition: color 0.2s;
  }

  .back-link:hover {
    color: #0256cc;
    text-decoration: underline;
  }

  .post-not-found {
    text-align: center;
    padding: 60px 20px;
  }

  .post-not-found h1 {
    color: #24292e;
    margin-bottom: 15px;
  }

  .post-not-found p {
    color: #666;
    margin-bottom: 30px;
  }

  @media (max-width: 640px) {
    .post-title {
      font-size: 24px;
    }

    .content-placeholder {
      padding: 20px;
    }
  }
</style>
