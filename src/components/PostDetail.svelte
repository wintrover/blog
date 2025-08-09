<script>
  import { createEventDispatcher } from 'svelte'
  import { formatDate, slugify } from '../lib/utils.js'
  import { siteConfig } from '../lib/config.js'
  
  export let post
  
  const dispatch = createEventDispatcher()
  
  function goBack() {
    dispatch('backToList')
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
      <div class="content-placeholder">
        <p><strong>Post content will be loaded here.</strong></p>
        <p>{post.excerpt}</p>
        <p>This is a placeholder for the full post content. In a real implementation, you would:</p>
        <ul>
          <li>Load the markdown file content</li>
          <li>Parse it with a markdown parser</li>
          <li>Render the HTML content</li>
        </ul>
        <p>For now, you can see the post metadata and excerpt above.</p>
      </div>
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
    padding: 0;
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
  
  .content-placeholder {
    background: #f8f9fa;
    padding: 30px;
    border-radius: 8px;
    border-left: 4px solid #0366d6;
  }
  
  .content-placeholder p {
    margin: 0 0 15px 0;
  }
  
  .content-placeholder ul {
    margin: 15px 0;
    padding-left: 20px;
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