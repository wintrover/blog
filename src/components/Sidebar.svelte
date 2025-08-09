<script>
  import { selectedCategory } from '../stores/category.js'
  import { posts } from '../stores/posts.js'
  import { slugify } from '../lib/utils.js'
  import { siteConfig } from '../lib/config.js'
  
  let categories = []
  
  $: {
    const categoryCount = {}
    $posts.forEach(post => {
      if (post.category) {
        categoryCount[post.category] = (categoryCount[post.category] || 0) + 1
      }
    })
    
    categories = [
      { name: 'All Posts', slug: 'all', count: $posts.length },
      ...Object.entries(categoryCount).map(([name, count]) => ({
        name,
        slug: slugify(name),
        count
      }))
    ]
  }
  
  function selectCategory(categorySlug) {
    selectedCategory.set(categorySlug)
  }
</script>

<div class="sidebar-header">
  <div class="profile-section">
    <a href={siteConfig.baseUrl + '/'} class="avatar-link">
      <img src={siteConfig.avatar} alt={siteConfig.name} class="avatar" />
    </a>
    <h1 class="site-name">
      <a href={siteConfig.baseUrl + '/'}>{siteConfig.name}</a>
    </h1>
    <p class="site-description">{siteConfig.description}</p>
  </div>
</div>

<div class="sidebar-module">
  <h4>Categories</h4>
  <ul class="category-list">
    {#each categories as category}
      <li>
        <button 
          class="category-link {$selectedCategory === category.slug ? 'active' : ''}"
          on:click={() => selectCategory(category.slug)}
        >
          {category.name} ({category.count})
        </button>
      </li>
    {/each}
  </ul>
</div>

<div class="sidebar-module">
  <h4>About</h4>
  <p>Working as a Fullstack AI Application Architect, sharing the latest tech trends and development experiences.</p>
</div>

<style>
  .sidebar-header {
    padding: 30px 20px;
    border-bottom: 1px solid #e1e4e8;
    background: white;
  }
  
  .profile-section {
    text-align: center;
  }
  
  .avatar-link {
    display: inline-block;
    margin-bottom: 15px;
  }
  
  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid #e1e4e8;
    transition: border-color 0.2s;
  }
  
  .avatar:hover {
    border-color: #0366d6;
  }
  
  .site-name {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
  }
  
  .site-name a {
    color: #24292e;
    text-decoration: none;
    transition: color 0.2s;
  }
  
  .site-name a:hover {
    color: #0366d6;
  }
  
  .site-description {
    margin: 0;
    color: #586069;
    font-size: 14px;
    line-height: 1.4;
  }
  
  .sidebar-module {
    padding: 20px;
    margin-bottom: 0;
    border-bottom: 1px solid #e1e4e8;
  }
  
  .sidebar-module:last-child {
    border-bottom: none;
  }
  
  .sidebar-module h4 {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 600;
    color: #24292e;
  }
  
  .category-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .category-list li {
    margin-bottom: 6px;
  }
  
  .category-link {
    background: none;
    border: none;
    color: #0366d6;
    cursor: pointer;
    font-size: 14px;
    padding: 6px 0;
    text-align: left;
    width: 100%;
    transition: color 0.2s;
    border-radius: 4px;
  }
  
  .category-link:hover {
    color: #0256cc;
    background: #f1f8ff;
    padding-left: 8px;
  }
  
  .category-link.active {
    color: #24292e;
    font-weight: 600;
    background: #e1f5fe;
    padding-left: 8px;
  }
  
  .sidebar-module p {
    color: #586069;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
  }
</style>