// Giscus configuration
export const giscusConfig = {
  // Repository where discussions will be created
  repo: import.meta.env.VITE_GISCUS_REPO || 'wintrover/blog',

  // Repository ID (found in Giscus settings)
  repoId: import.meta.env.VITE_GISCUS_REPO_ID || 'R_kgDOGOEESY',

  // Discussion category
  category: import.meta.env.VITE_GISCUS_CATEGORY || 'General',

  // Category ID (found in Giscus settings)
  categoryId: import.meta.env.VITE_GISCUS_CATEGORY_ID || 'DIC_kwDOPBuacs4Cwqu_',

  // How discussions are mapped to pages
  // Options: pathname, url, title, og:title, specific
  mapping: 'title',

  // Strict matching
  strict: '1',

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