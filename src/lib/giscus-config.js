// Giscus configuration
export const giscusConfig = {
  // These values should be replaced with your actual Giscus configuration
  // Get them from: https://giscus.app

  // Repository where discussions will be created
  repo: import.meta.env.VITE_GISCUS_REPO || 'wintrover/blog',

  // Repository ID (found in Giscus settings)
  repoId: import.meta.env.VITE_GISCUS_REPO_ID || 'R_kgDOKkT5Gg',

  // Discussion category
  category: import.meta.env.VITE_GISCUS_CATEGORY || 'General',

  // Category ID (found in Giscus settings)
  categoryId: import.meta.env.VITE_GISCUS_CATEGORY_ID || 'DIC_kwDOKkT5Gs4CY4vM',

  // How discussions are mapped to pages
  // Options: pathname, url, title, og:title, specific
  mapping: 'pathname',

  // Strict matching
  strict: '0',

  // Enable reactions (👍, ❤️, etc.)
  reactionsEnabled: '1',

  // Emit metadata
  emitMetadata: '0',

  // Input position: top or bottom
  inputPosition: 'bottom',

  // Theme: light, dark, dark_dimmed, dark_high_contrast,
  // transparent_dark, preferred_color_scheme, or custom
  theme: 'preferred_color_scheme',

  // Language
  lang: 'ko'
};