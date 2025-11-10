// Giscus configuration
const isDev = import.meta.env.DEV;

export const giscusConfig = {
  // Repository where discussions will be created
  repo: import.meta.env.VITE_GISCUS_REPO || 'wintrover/blog',

  // Repository ID (found in Giscus settings)
  repoId: import.meta.env.VITE_GISCUS_REPO_ID || 'R_kgDOQOClcw',

  // Discussion category
  category: import.meta.env.VITE_GISCUS_CATEGORY || 'General',

  // Category ID (found in Giscus settings)
  categoryId: import.meta.env.VITE_GISCUS_CATEGORY_ID || 'DIC_kwDOQOClc84CxX8B',

  // How discussions are mapped to pages
  // Options: pathname, url, title, og:title, specific
  mapping: 'pathname',

  // Strict matching - set to '0' for more flexible matching
  strict: '0',

  // Enable reactions (👍, ❤️, etc.)
  reactionsEnabled: '0',

  // Emit metadata
  emitMetadata: '0',

  // Input position: top or bottom
  inputPosition: 'bottom',

  // Theme: light, dark, dark_dimmed, dark_high_contrast,
  // transparent_dark, preferred_color_scheme, or custom
  theme: 'preferred_color_scheme',

  // Language
  lang: 'en',

  // Development-only debugging
  debug: isDev
};