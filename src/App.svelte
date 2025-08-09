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
  let contentElement
  let intersectionObserver
  let manualToggle = false // 수동 토글 상태
  let manualToggleTimeout
  let resizeTimeout // 리사이즈 디바운스용

  // 사이드바 상태 변화 감지
  $: {
    if (typeof document !== 'undefined') {
      if (sidebarCollapsed) {
        document.body.classList.add('sidebar-collapsed')
        console.log('사이드바 접힘: sidebar-collapsed 클래스 추가됨')
      } else {
        document.body.classList.remove('sidebar-collapsed')
        console.log('사이드바 펼침: sidebar-collapsed 클래스 제거됨')
      }
    }
  }
  
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
    selectedCategory.set('all')
  }

  let checkTimeout = null

  function checkSidebarCollision() {
    if (!sidebarElement || !mainContentElement) {
      return
    }

    // manualToggle 상태일 때는 자동 충돌 감지 비활성화
    if (manualToggle) {
      return
    }

    // 디바운스: 이전 타이머 취소하고 새로 설정
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      // 요소가 null이면 리턴
      if (!sidebarElement || !contentElement) {
        return
      }
      
      // 요소가 아직 렌더링되지 않았다면 사이드바를 표시
      const sidebarRect = sidebarElement.getBoundingClientRect()
      const contentRect = contentElement.getBoundingClientRect()
      
      if (sidebarRect.width === 0 || contentRect.width === 0) {
        if (sidebarCollapsed) {
          sidebarCollapsed = false
        }
        return
      }

      // 화면이 너무 작으면 자동으로 접기
      if (window.innerWidth < 768) {
        if (!sidebarCollapsed) {
          sidebarCollapsed = true
        }
        return
      }
      
      // 화면이 충분히 크고 사이드바가 접혀있으면 펼치기
      if (window.innerWidth >= 1200 && sidebarCollapsed) {
        if (contentRect.left > 120) {
          sidebarCollapsed = false
        }
        return
      }

      // 사이드바와 콘텐츠가 겹치는지 확인 (사이드바 오른쪽 끝이 콘텐츠 왼쪽 시작점을 넘어가면 겹침)
       console.log('사이드바 오른쪽 끝 x좌표:', Math.round(sidebarRect.right))
       console.log('콘텐츠 왼쪽 시작 x좌표:', Math.round(contentRect.left))
       console.log('겹침 여부:', sidebarRect.right >= contentRect.left)
      const isOverlapping = sidebarRect.right >= contentRect.left

      // 무한 루프 방지: 현재 상태와 다를 때만 변경
      // 겹치면서 현재 펼쳐져 있으면 접기
      if (isOverlapping && !sidebarCollapsed) {
        sidebarCollapsed = true
      }
      // 콘텐츠의 왼쪽 x좌표가 120보다 크고 현재 접혀져 있으면 펼치기
      else if (contentRect.left > 120 && sidebarCollapsed) {
        sidebarCollapsed = false
      }
    }, 5) // 5ms 디바운스
  }

  function debouncedCheckSidebarCollision() {
    if (checkTimeout) {
      clearTimeout(checkTimeout)
    }
    checkTimeout = setTimeout(checkSidebarCollision, 10)
  }

  function handleResize() {
    // 리사이즈 시 수동 토글 상태 리셋
    manualToggle = false
    checkSidebarCollision()
  }

  function toggleSidebar() {
    manualToggle = true
    sidebarCollapsed = !sidebarCollapsed
  }

  onMount(() => {
    // 초기 체크를 여러 번 시도 (배포 환경에서 DOM 로딩 지연 대응)
    const checkWithRetry = () => {
      checkSidebarCollision()
      // 요소가 아직 준비되지 않았으면 다시 시도
      if (!sidebarElement || !mainContentElement) {
        setTimeout(checkWithRetry, 200)
      }
    }
    
    setTimeout(checkWithRetry, 100)
    
    // ResizeObserver로 요소 크기 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      debouncedCheckSidebarCollision()
    })
    
    if (sidebarElement) resizeObserver.observe(sidebarElement)
    if (mainContentElement) resizeObserver.observe(mainContentElement)
    
    window.addEventListener('resize', handleResize)
    
    return () => {
        if (checkTimeout) {
          clearTimeout(checkTimeout)
        }
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
    <button id="sidebar-toggle" on:click={toggleSidebar}>
      ☰
    </button>
  {/if}
  
  <main id="main-content" bind:this={mainContentElement}>
    <div id="content" bind:this={contentElement}>
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
    transition: all 0.01s ease;
  }

  #sidebar {
    width: 240px;
    background: #f8f9fa;
    border-right: 0;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
    padding: 0;
    transform: translateX(0);
    transition: transform 0.01s ease;
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
    transition: margin-left 0.01s ease;
  }
  

  
  #content {
    flex: 1;
    max-width: 800px;
    margin: 40px auto;
    width: 100%;
  }
  
  .sidebar-collapsed #main-content {
    margin-left: 0;
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