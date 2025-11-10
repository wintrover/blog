# GitHub Pages Deployment Testing Strategy

## Local Testing Steps

### 1. Build and Test Locally
```bash
# Clean previous build
rm -rf dist/

# Build for GitHub Pages
npm run build:github

# Verify files exist
ls -la dist/
# Should see: index.html, 404.html, assets/ folder

# Local preview with correct base path
npm run preview:github
```

### 2. Test SPA Routing Locally
Open http://localhost:4173/blog/ and test:
- Home page: `http://localhost:4173/blog/#/`
- Category page: `http://localhost:4173/blog/#/category/tech`
- Post page: `http://localhost:4173/blog/#/post/your-post-slug`

### 3. Test 404 Redirect
Open invalid URLs and verify they redirect properly:
- `http://localhost:4173/blog/nonexistent`
- `http://localhost:4173/blog/category/nonexistent`

## GitHub Pages Testing Steps

### 1. Manual Deployment Test
```bash
# Build and copy files
npm run deploy:github

# Manually deploy dist/ folder to your gh-pages branch or main/docs folder
```

### 2. Automated Deployment Test
Push changes to main branch and let GitHub Actions deploy automatically.

### 3. Production Testing
After deployment, test these URLs:

**Base URL Tests:**
- ✅ `https://wintrover.github.io/blog/` - Should load home page
- ✅ `https://wintrover.github.io/blog/#/` - Should load home page

**Direct Route Tests:**
- ✅ `https://wintrover.github.io/blog/#/category/tech` - Should load tech category
- ✅ `https://wintrover.github.io/blog/#/post/your-slug` - Should load specific post

**404 Redirect Tests:**
- ✅ `https://wintrover.github.io/blog/nonexistent` - Should redirect to SPA
- ✅ `https://wintrover.github.io/blog/category/nonexistent` - Should redirect to SPA

### 4. Deep Linking Tests
Test that direct links work:
1. Copy a post URL from your site
2. Paste into new browser tab
3. Verify it loads correctly without manual navigation

### 5. Navigation Tests
Test all navigation:
- ✅ Sidebar category links work
- ✅ Post title links work
- ✅ Back button works
- ✅ Browser refresh maintains current page

### 6. Asset Loading Tests
Verify all assets load correctly:
- ✅ Profile image loads
- ✅ Post images display
- ✅ CSS styles apply correctly
- ✅ JavaScript functions work

### 7. Mobile Testing
Test on mobile browsers:
- ✅ Responsive design works
- ✅ Touch navigation works
- ✅ Sidebar toggle functions

## Troubleshooting Checklist

### If routes don't work:
1. Check that `base: '/blog/'` is set in vite.config.js
2. Verify 404.html exists in dist/ folder
3. Confirm assets use relative paths with `/blog/` prefix

### If assets don't load:
1. Check that index.html references have `/blog/` prefix
2. Verify `public/` folder assets are copied to dist/
3. Check GitHub Pages deployment settings

### If 404 redirect fails:
1. Verify 404.html is in the root of dist/
2. Check JavaScript in 404.html for syntax errors
3. Test that redirect script executes properly

## Performance Verification
- ✅ Page loads within 3 seconds
- ✅ Images optimize properly
- ✅ JavaScript bundle size is reasonable
- ✅ CSS loads efficiently

## SEO and Accessibility
- ✅ Meta titles load correctly
- ✅ Proper HTML structure maintained
- ✅ Screen reader navigation works
- ✅ Keyboard navigation functional