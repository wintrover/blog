<script>
  import { onMount } from 'svelte';
  import { giscusConfig } from '../lib/giscus-config.js';

  // Use configuration or allow override via props
  export let repo = giscusConfig.repo;
  export let repoId = giscusConfig.repoId;
  export let category = giscusConfig.category;
  export let categoryId = giscusConfig.categoryId;
  export let mapping = giscusConfig.mapping;
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

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-strict', strict);
    script.setAttribute('data-reactions-enabled', reactionsEnabled);
    script.setAttribute('data-emit-metadata', emitMetadata);
    script.setAttribute('data-input-position', inputPosition);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', lang);
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
      giscusLoaded = true;
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