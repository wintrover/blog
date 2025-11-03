<script>
  import { onMount } from 'svelte';
  import { giscusConfig } from '../lib/giscus-config.js';

  // Use configuration or allow override via props
  export let repo = giscusConfig.repo;
  // Temporarily hardcode the correct repo ID
  export let repoId = 'R_kgDOGOEESY'; // giscusConfig.repoId;
  export let category = giscusConfig.category;
  export let categoryId = giscusConfig.categoryId;
  // Use specific term mapping for better reliability
  export let mapping = 'specific';
  export let term = 'blog-comments'; // Will be updated with slug
  export let strict = giscusConfig.strict;
  export let reactionsEnabled = giscusConfig.reactionsEnabled;
  export let emitMetadata = giscusConfig.emitMetadata;
  export let inputPosition = giscusConfig.inputPosition;
  export let theme = giscusConfig.theme;
  export let lang = giscusConfig.lang;

  let giscusLoaded = false;
  let container;

  onMount(() => {
    loadGiscus();
  });

  async function loadGiscus() {
    if (giscusLoaded) return;

    console.group('🔍 Giscus Debug Information');
    console.log('Raw env vars:');
    console.log('  VITE_GISCUS_REPO:', import.meta.env.VITE_GISCUS_REPO);
    console.log('  VITE_GISCUS_REPO_ID:', import.meta.env.VITE_GISCUS_REPO_ID);
    console.log('  VITE_GISCUS_CATEGORY:', import.meta.env.VITE_GISCUS_CATEGORY);
    console.log('  VITE_GISCUS_CATEGORY_ID:', import.meta.env.VITE_GISCUS_CATEGORY_ID);
    console.log('');
    console.log('Actual values:');
    console.log('Repository:', repo);
    console.log('Repository ID:', repoId);
    console.log('Category:', category);
    console.log('Category ID:', categoryId);
    console.log('Mapping:', mapping);
    console.log('Term:', term);
    console.log('Strict mode:', strict);
    console.log('Theme:', theme);
    console.log('Lang:', lang);

    // Check if all required values are present
    if (!repo || !repoId || !categoryId) {
      console.error('❌ Missing required Giscus configuration:');
      console.error('Repo:', repo);
      console.error('Repo ID:', repoId);
      console.error('Category ID:', categoryId);
      console.groupEnd();
      return;
    }

    console.log('✅ All required configuration values present');

    // Build the URL that Giscus will call
    const apiUrl = new URL('https://giscus.app/api/discussions');
    apiUrl.searchParams.append('repo', repo);
    if (mapping === 'specific' && term) {
      apiUrl.searchParams.append('term', term);
    }
    apiUrl.searchParams.append('category', category);
    apiUrl.searchParams.append('number', '0');
    apiUrl.searchParams.append('strict', strict);
    apiUrl.searchParams.append('first', '15');

    console.log('📡 Giscus API URL:', apiUrl.toString());

    // Test the API call directly
    try {
      const response = await fetch(apiUrl.toString());
      console.log('📥 API Response Status:', response.status);
      const data = await response.json();
      console.log('📦 API Response Data:', data);

      if (response.status === 404) {
        console.warn('⚠️ Discussion not found - this is normal for new posts');
        console.info('💡 A new discussion will be created when the first comment is posted');
      }
    } catch (error) {
      console.error('❌ API call failed:', error);
    }

    console.groupEnd();

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    if (mapping === 'specific' && term) {
      script.setAttribute('data-term', term);
    }
    script.setAttribute('data-strict', strict);
    script.setAttribute('data-reactions-enabled', reactionsEnabled);
    script.setAttribute('data-emit-metadata', emitMetadata);
    script.setAttribute('data-input-position', inputPosition);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', lang);
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    // Add event listeners for debugging
    script.addEventListener('load', () => {
      console.log('✅ Giscus script loaded successfully');
    });

    script.addEventListener('error', (e) => {
      console.error('❌ Giscus script failed to load:', e);
    });

    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
      giscusLoaded = true;

      // Monitor for iframe creation
      setTimeout(() => {
        const iframe = container.querySelector('iframe');
        if (iframe) {
          console.log('🖼️ Giscus iframe created');
          iframe.addEventListener('load', () => {
            console.log('✅ Giscus iframe loaded');
          });
          iframe.addEventListener('error', (e) => {
            console.error('❌ Giscus iframe error:', e);
          });
        } else {
          console.warn('⚠️ Giscus iframe not found after 2 seconds');
        }
      }, 2000);
    }
  }

  // Function to update theme (optional)
  export function updateTheme(newTheme) {
    theme = newTheme;
    const iframe = container?.querySelector('iframe');
    if (iframe) {
      iframe.contentWindow.postMessage({
        giscus: {
          setConfig: {
            theme: newTheme
          }
        }
      }, 'https://giscus.app');
    }
  }
</script>

<div class="comments-container">
  <div class="comments-header">
    <h3>댓글</h3>
    <p class="comments-info">
      GitHub 계정으로 댓글을 남길 수 있습니다.
    </p>
  </div>
  <div bind:this={container} class="giscus-wrapper"></div>
</div>

<style>
  .comments-container {
    margin-top: 60px;
    padding-top: 40px;
    border-top: 1px solid #e1e4e8;
  }

  .comments-header {
    margin-bottom: 30px;
  }

  .comments-header h3 {
    font-size: 24px;
    font-weight: 600;
    color: #24292e;
    margin: 0 0 8px 0;
  }

  .comments-info {
    font-size: 14px;
    color: #586069;
    margin: 0;
  }

  .giscus-wrapper {
    min-height: 200px;
  }

  /* Giscus iframe responsive */
  .giscus-wrapper :global(iframe) {
    width: 100%;
    min-height: 200px;
    border: none;
  }

  /* Dark theme support */
  @media (prefers-color-scheme: dark) {
    .comments-header h3 {
      color: #f0f6fc;
    }

    .comments-info {
      color: #8b949e;
    }

    .comments-container {
      border-top-color: #30363d;
    }
  }
</style>