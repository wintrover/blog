<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { formatDate, slugify } from "../lib/utils.js";
  import { loadPost } from "../lib/markdown.js";

  export let post;

  const dispatch = createEventDispatcher();
  let markdownContent = null;
  let loading = true;

  onMount(async () => {
    if (post && post.slug) {
      markdownContent = await loadPost(post.slug);
      loading = false;
    }
  });

  function goBack() {
    dispatch("backToList");
  }
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
    padding: 30px;
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
    margin: var(--devsite-code-margin, 16px 0);
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
  }

  .markdown-content :global(.devsite-code-buttons-container) {
    position: absolute;
    right: var(--devsite-code-buttons-container-right, 0);
    top: 0;
    z-index: 1;
    margin: 0;
    padding: 0;
    box-sizing: inherit;
    display: block;
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

  .markdown-content :global(.devsite-icon-code-dark)::before {
    content: '🌙';
  }

  .markdown-content :global(.devsite-icon-code-light)::before {
    content: '☀️';
  }

  .markdown-content :global(.devsite-icon-copy)::before {
    content: '📋';
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
