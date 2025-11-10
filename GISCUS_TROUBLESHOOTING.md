# Giscus Comment System Troubleshooting Guide

## Error Analysis and Solutions

### 🔍 Issue Summary
Your Giscus setup was experiencing three critical errors:

1. **"Unchecked runtime.lastError: The message port closed before a response was received"**
2. **"GET https://giscus.app/api/discussions?repo=wintrover%2Fblog&category=General&number=0&strict=1&first=15 404 (Not Found)"**
3. **"POST https://api.github.com/graphql 401 (Unauthorized)"**

## ✅ Applied Solutions

### 1. Fixed Configuration Mismatches
**Problem**: Multiple different repository and category IDs across configuration files
**Solution**: Standardized all configuration values

**Files Updated:**
- `D:\Coding\blog\.env` - Updated with current values
- `D:\Coding\blog\src\lib\giscus-config.js` - Synchronized fallback values

### 2. Changed Mapping Strategy
**Problem**: Using `title` mapping with long, special-character-heavy titles
**Solution**: Switched to `pathname` mapping for more reliable discussion matching

**Changes Made:**
- Mapping: `'title'` → `'pathname'`
- Strict mode: `'1'` → `'0'` (more flexible matching)
- Removed unnecessary `term` parameter from PostDetail component

### 3. Removed Problematic GraphQL Testing
**Problem**: Debug code was attempting unauthorized GitHub API calls
**Solution**: Removed unnecessary GraphQL testing code that was causing 401 errors

## 🚀 Step-by-Step Setup Instructions

### Step 1: Verify GitHub Repository Setup
1. Go to your `wintrover/blog` repository on GitHub
2. Navigate to **Settings** > **Features**
3. Ensure **Discussions** is enabled
4. If not enabled, check the box and save changes

### Step 2: Configure Giscus Application
1. Visit [giscus.app](https://giscus.app)
2. Click **Get started**
3. **Enter repository**: `wintrover/blog`
4. **Page ↔️ discussions mapping**: Select **pathname** ⚠️
5. **Discussion category**: Select **General**
6. **Features**:
   - ✅ Enable reactions
   - ✅ Send me email notifications about new discussions
7. Click **Install** and authorize the Giscus app

### Step 3: Update Environment Variables
Your `.env` file should contain:
```env
# Giscus Configuration (Vite)
VITE_GISCUS_REPO=wintrover/blog
VITE_GISCUS_REPO_ID=R_kgDOI01KDV  # Get this from giscus.app
VITE_GISCUS_CATEGORY=General
VITE_GISCUS_CATEGORY_ID=DIC_kwDOQOClc84CxX8B  # Get this from giscus.app
```

⚠️ **Important**: The `repoId` and `categoryId` values MUST come from the giscus.app configuration page after you complete Step 2.

### Step 4: Restart Development Server
```bash
# Stop the current server (Ctrl+C)
# Restart to pick up new environment variables
npm run dev
```

### Step 5: Test the Implementation
1. Navigate to any blog post
2. Check the browser console - you should see no 404 or 401 errors
3. The Giscus comment section should load at the bottom of posts
4. Try posting a test comment using your GitHub account

## 🔧 Troubleshooting Checklist

### ✅ Before Starting
- [ ] GitHub Discussions is enabled in repository settings
- [ ] Giscus app is installed on the repository
- [ ] Environment variables are correctly set
- [ ] Development server has been restarted

### ✅ If Comments Don't Load
1. **Check Console Errors**: Open browser dev tools and look for Giscus-related errors
2. **Verify Configuration**: Compare your `.env` values with giscus.app settings
3. **Check Network Tab**: Look for failed requests to `giscus.app`
4. **Repository Access**: Ensure the repository is public and you have write access

### ✅ If Comments Show but Can't Post
1. **GitHub Login**: Ensure you're logged into GitHub
2. **App Permissions**: Verify Giscus app has repository access
3. **Category Exists**: Confirm the "General" category exists in Discussions

### ✅ If Getting 404 Errors
1. **Repository ID**: Double-check `VITE_GISCUS_REPO_ID` matches giscus.app
2. **Category ID**: Verify `VITE_GISCUS_CATEGORY_ID` is correct
3. **Repository Name**: Ensure it matches exactly: `wintrover/blog`

## 🐛 Common Issues and Solutions

### Issue: "Message port closed" error
**Cause**: Extension conflicts or script loading order
**Solution**:
- Disable browser extensions temporarily
- Ensure Giscus script loads after page content
- Try in an incognito window

### Issue: 404 Not Found on discussions API
**Cause**: Incorrect repository or category IDs
**Solution**:
- Regenerate configuration on giscus.app
- Copy exact values to `.env` file
- Restart development server

### Issue: 401 Unauthorized on GitHub GraphQL
**Cause**: Debug code attempting API calls without authentication
**Solution**: Already fixed in code changes

## 📝 Configuration Reference

### Final Working Configuration
```javascript
// src/lib/giscus-config.js
export const giscusConfig = {
  repo: 'wintrover/blog',
  repoId: 'R_kgDOI01KDV',           // From giscus.app
  category: 'General',
  categoryId: 'DIC_kwDOQOClc84CxX8B', // From giscus.app
  mapping: 'pathname',               // ⚠️ Changed from 'title'
  strict: '0',                       // ⚠️ Changed from '1'
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'bottom',
  theme: 'preferred_color_scheme',
  lang: 'ko'
};
```

### Usage in Components
```svelte
<!-- In PostDetail.svelte -->
<Comments />

<!-- No need to pass term or mapping parameters -->
<!-- They're automatically handled by the configuration -->
```

## 🎯 Success Criteria

Your Giscus implementation is working correctly when:

- [ ] No 404 or 401 errors in browser console
- [ ] Comment widget loads at bottom of blog posts
- [ ] Users can authenticate with GitHub
- [ ] Comments are posted successfully
- [ ] Comments appear in GitHub Discussions tab
- [ ] Theme switching works (light/dark mode)

## 📞 Additional Support

If issues persist:

1. **Check the Giscus Documentation**: [https://giscus.app/](https://giscus.app/)
2. **GitHub Issues**: [https://github.com/giscus/giscus/issues](https://github.com/giscus/giscus/issues)
3. **Repository Discussions**: Check if discussions are enabled and working

## 🔄 Maintenance

定期チェック (Regular Checks):
- Verify Giscus app permissions remain active
- Monitor for GitHub API changes
- Update configuration if repository settings change
- Test comment functionality after major updates