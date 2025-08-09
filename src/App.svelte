<script>
  import Sidebar from './components/Sidebar.svelte'
  import BlogList from './components/BlogList.svelte'
  import PostDetail from './components/PostDetail.svelte'
  import Footer from './components/Footer.svelte'
  import { posts } from './stores/posts.js'
  import { selectedCategory } from './stores/category.js'
  
  let filteredPosts = []
  let currentView = 'list' // 'list' or 'post'
  let selectedPost = null
  
  $: {
    if ($selectedCategory === 'all') {
      filteredPosts = $posts
    } else {
      // 실제 카테고리 이름으로 필터링
      filteredPosts = $posts.filter(post => post.category === $selectedCategory)
    }
  }
  
  function showPost(post) {
    selectedPost = post
    currentView = 'post'
  }
  
  function showList() {
    currentView = 'list'
    selectedPost = null
  }
</script>

<div id="app-container">
  <aside id="sidebar">
    <Sidebar />
  </aside>
  
  <main id="main-content">
    <div id="content">
      {#if currentView === 'list'}
        <BlogList posts={filteredPosts} on:selectPost={(e) => showPost(e.detail)} />
      {:else if currentView === 'post' && selectedPost}
        <PostDetail post={selectedPost} on:backToList={showList} />
      {/if}
    </div>
    <Footer />
  </main>
</div>

<style>
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #fff;
    color: #333;
  }
  
  #app-container {
    display: flex;
    min-height: 100vh;
  }
  
  #sidebar {
    width: 240px;
    background: #f8f9fa;
    border-right: 1px solid #e1e4e8;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
    padding: 0;
  }
  
  #main-content {
    flex: 1;
    margin-left: 240px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  #content {
    flex: 1;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    width: 100%;
  }
  
  @media (max-width: 1024px) {
    #sidebar {
      width: 210px;
    }
    
    #main-content {
      margin-left: 210px;
    }
  }
  
  @media (max-width: 768px) {
    #app-container {
      flex-direction: column;
    }
    
    #sidebar {
      position: relative;
      width: 100%;
      height: auto;
    }
    
    #main-content {
      margin-left: 0;
    }
    
    #content {
      padding: 20px;
    }
  }
</style>