<script>
  import Sidebar from './components/Sidebar.svelte'
  import BlogList from './components/BlogList.svelte'
  import PostDetail from './components/PostDetail.svelte'
  import Footer from './components/Footer.svelte'
  import { posts } from './stores/posts.js'
  import { selectedCategory } from './stores/category.js'
  import { onMount } from 'svelte'
  
  let filteredPosts = []
  let currentView = 'list' // 'list' or 'post'
  let selectedPost = null
  let sidebarCollapsed = false
  let sidebarElement
  let mainContentElement
  let intersectionObserver
  
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

  function checkSidebarCollision() {
    if (!sidebarElement || !mainContentElement) return
    
    const sidebarRect = sidebarElement.getBoundingClientRect()
    const contentRect = mainContentElement.getBoundingClientRect()
    
    // 사이드바와 콘텐츠가 실제로 겹치는지 확인
    const isOverlapping = sidebarRect.right > contentRect.left && 
                         sidebarRect.left < contentRect.right &&
                         sidebarRect.bottom > contentRect.top &&
                         sidebarRect.top < contentRect.bottom
    
    // 겹치면 사이드바를 접고, 겹치지 않으면 펼침
    sidebarCollapsed = isOverlapping
  }

  function handleResize() {
    checkSidebarCollision()
  }

  onMount(() => {
    // 초기 체크를 위한 지연
    setTimeout(() => {
      checkSidebarCollision()
    }, 100)
    
    // ResizeObserver로 요소 크기 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      checkSidebarCollision()
    })
    
    if (sidebarElement) resizeObserver.observe(sidebarElement)
    if (mainContentElement) resizeObserver.observe(mainContentElement)
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  })
</script>

<div id="app-container" class:sidebar-collapsed={sidebarCollapsed}>
  <aside id="sidebar" class:collapsed={sidebarCollapsed} bind:this={sidebarElement}>
    <Sidebar />
  </aside>
  
  {#if sidebarCollapsed}
    <button id="sidebar-toggle" on:click={() => sidebarCollapsed = !sidebarCollapsed}>
      ☰
    </button>
  {/if}
  
  <main id="main-content" bind:this={mainContentElement}>
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
    transition: all 0.3s ease;
  }
  
  #sidebar {
    width: 240px;
    background: #f8f9fa;
    border-right: 1px solid #e1e4e8;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
    padding: 0;
    transform: translateX(0);
    transition: transform 0.3s ease;
    z-index: 1000;
  }
  
  #sidebar.collapsed {
    transform: translateX(-100%);
  }
  
  #sidebar-toggle {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1001;
    background: #0366d6;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 12px;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: background-color 0.2s;
  }
  
  #sidebar-toggle:hover {
    background: #0256cc;
  }
  
  #main-content {
    flex: 1;
    margin-left: 240px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    transition: margin-left 0.3s ease;
  }
  
  .sidebar-collapsed #main-content {
    margin-left: 0;
  }
  
  #content {
    flex: 1;
    max-width: 800px;
    margin: 40px auto;
    width: 100%;
  }
  
  @media (max-width: 480px) {
    #content {
      margin: 20px 15px;
    }
    
    #sidebar-toggle {
      top: 15px;
      left: 15px;
      padding: 8px 10px;
      font-size: 14px;
    }
  }
</style>