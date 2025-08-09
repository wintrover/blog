<script>
  import { formatDate, truncateText, slugify } from '../lib/utils.js'
  import { siteConfig } from '../lib/config.js'
  
  export let posts = []
</script>

<div class="blog-page">
  {#if posts.length > 0}
    <div class="posts">
      {#each posts as post}
        <article class="post">
          <div class="post-meta">
            <span class="date">{formatDate(post.date)}</span>
            {#if post.category}
              <span class="category-badge {slugify(post.category)}">
                {post.category}
              </span>
            {/if}
          </div>
          <h1>
            <a href="{siteConfig.baseUrl}/posts/{post.slug}/">{post.title}</a>
          </h1>
          {#if post.excerpt}
            <div class="post-excerpt">
              {truncateText(post.excerpt)}
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {:else}
    <div class="no-posts">
      <p>No posts found in this category.</p>
    </div>
  {/if}
</div>

<style>
  .blog-page {
    min-height: 400px;
  }
  
  .posts {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
  
  .post {
    border-bottom: 1px solid #eee;
    padding-bottom: 30px;
  }
  
  .post:last-child {
    border-bottom: none;
  }
  
  .post-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .date {
    color: #666;
    font-size: 14px;
  }
  
  .category-badge {
    background: #0366d6;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .category-badge.project {
    background: #28a745;
  }
  
  .post h1 {
    margin: 0 0 15px 0;
    font-size: 24px;
    line-height: 1.3;
  }
  
  .post h1 a {
    color: #333;
    text-decoration: none;
    transition: color 0.2s;
  }
  
  .post h1 a:hover {
    color: #0366d6;
  }
  
  .post-excerpt {
    color: #666;
    line-height: 1.6;
    font-size: 16px;
  }
  
  .no-posts {
    text-align: center;
    padding: 60px 20px;
    color: #666;
  }
  
  @media (max-width: 640px) {
    .post h1 {
      font-size: 20px;
    }
    
    .post-excerpt {
      font-size: 14px;
    }
  }
</style>