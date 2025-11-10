<script>
  import { onMount } from 'svelte';
  import { giscusConfig } from '../lib/giscus-config.js';

  // Use configuration or allow override via props
  // Use configuration or allow override via props
  export let repo = giscusConfig.repo;
  export let repoId = giscusConfig.repoId;
  export let category = giscusConfig.category;
  export let categoryId = giscusConfig.categoryId;
  // Allow override of mapping via props
  export let mapping = giscusConfig.mapping;
  export let term = ''; // Used when mapping is 'specific'
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

    // Only debug in development
    if (import.meta.env.DEV) {
      console.group('🔍 Giscus Debug Information');
      console.log('Repository:', repo);
      console.log('Repository ID:', repoId);
      console.log('Category:', category);
      console.log('Category ID:', categoryId);
      console.log('Mapping:', mapping);
      console.log('Term:', term);
      console.log('Debug mode enabled');
    }

    // Check if all required values are present
    if (!repo || !repoId || !categoryId) {
      console.error('❌ Missing required Giscus configuration:');
      console.error('Repo:', repo);
      console.error('Repo ID:', repoId);
      console.error('Category ID:', categoryId);
      if (import.meta.env.DEV) {
        console.groupEnd();
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log('✅ All required configuration values present');
    }

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

    // API URL and parameters logged for debugging purposes
    // console.log('📡 Giscus API URL:', apiUrl.toString());

  // Note: Direct API testing removed to prevent CORS errors
    // Giscus handles API calls internally through its script

    console.groupEnd();

    // Monitor network requests for debugging
    console.group('🌐 Network Request Monitoring');
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    // Monitor fetch requests
    window.fetch = function(...args) {
      const [url, options] = args;
      if (url.includes('giscus.app') || url.includes('github.com')) {
        console.log('📡 Fetch request:', url, options);
        return originalFetch.apply(this, args)
          .then(response => {
            console.log('📥 Fetch response:', response.status, response.statusText);
            return response.clone().text().then(text => {
              try {
                const json = JSON.parse(text);
                console.log('📦 Fetch response body:', json);
              } catch {
                console.log('📦 Fetch response body (raw):', text.substring(0, 500));
              }
              return response;
            });
          })
          .catch(error => {
            console.error('❌ Fetch error:', error);
            throw error;
          });
      }
      return originalFetch.apply(this, args);
    };

    // Monitor XMLHttpRequest
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (url.includes('giscus.app') || url.includes('github.com')) {
        console.log('📡 XHR request:', method, url);
        this._giscusDebug = true;
      }
      return originalXHROpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      if (this._giscusDebug) {
        this.addEventListener('load', () => {
          console.log('📥 XHR response:', this.status, this.statusText);
          console.log('📦 XHR response body:', this.responseText?.substring(0, 500));
        });
        this.addEventListener('error', (e) => {
          console.error('❌ XHR error:', e);
        });
      }
      return originalXHRSend.apply(this, args);
    };

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

      // Monitor for iframe creation with enhanced debugging
      const monitorIframe = () => {
        const iframe = container.querySelector('iframe');
        if (iframe) {
          console.log('🖼️ Giscus iframe created');
          console.log('📄 Iframe src:', iframe.src);
          console.log('📄 Iframe dataset:', iframe.dataset);

          // Log all data attributes
          console.group('🔍 Iframe Data Attributes');
          Object.keys(iframe.dataset).forEach(key => {
            console.log(`  data-${key}: ${iframe.dataset[key]}`);
          });
          console.groupEnd();

          iframe.addEventListener('load', () => {
            console.log('✅ Giscus iframe loaded');
            console.log('📄 Iframe src after load:', iframe.src);

            // Try to access iframe content for debugging
            try {
              console.log('📄 Iframe contentWindow exists:', !!iframe.contentWindow);
              if (iframe.contentDocument) {
                console.log('📄 Iframe title:', iframe.contentDocument.title);
              }
            } catch (e) {
              console.warn('⚠️ Cannot access iframe content (CORS):', e.message);
            }
          });

          iframe.addEventListener('error', (e) => {
            console.error('❌ Giscus iframe error:', e);
          });

          // Monitor messages from iframe
          const messageListener = (event) => {
            if (event.origin === 'https://giscus.app') {
              console.log('📨 Message from Giscus iframe:', event.data);
            }
          };
          window.addEventListener('message', messageListener);

          // Store listener for cleanup
          iframe._messageListener = messageListener;

          return true;
        } else {
          console.warn('⚠️ Giscus iframe not found after 2 seconds');
          console.log('🔍 Container content:', container.innerHTML);
          return false;
        }
      };

      // Try multiple times with increasing delays
      setTimeout(monitorIframe, 2000);
      setTimeout(monitorIframe, 5000);
      setTimeout(monitorIframe, 10000);
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