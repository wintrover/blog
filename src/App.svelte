<script>
  import Sidebar from './components/Sidebar.svelte'
  import BlogList from './components/BlogList.svelte'
  import Footer from './components/Footer.svelte'
  import { posts } from './stores/posts.js'
  import { selectedCategory } from './stores/category.js'
  
  let filteredPosts = []
  
  $: {
    if ($selectedCategory === 'all') {
      filteredPosts = $posts
    } else {
      filteredPosts = $posts.filter(post => post.category === $selectedCategory)
    }
  }
</script>

<div id="app-container">
  <aside id="sidebar">
    <Sidebar />
  </aside>
  
  <main id="main-content">
    <div id="content">
      <BlogList posts={filteredPosts} />
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
    width: 320px;
    background: #f8f9fa;
    border-right: 1px solid #e1e4e8;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
    padding: 0;
  }
  
  #main-content {
    flex: 1;
    margin-left: 320px;
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
      width: 280px;
    }
    
    #main-content {
      margin-left: 280px;
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