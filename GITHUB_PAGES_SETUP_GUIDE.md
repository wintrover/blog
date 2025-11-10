# GitHub Pages Deployment Setup Guide

This guide provides multiple solutions to resolve GitHub Actions permission errors when deploying to GitHub Pages.

## Quick Solutions (Choose One)

### Solution 1: Fix Permissions in Existing Workflow (Recommended)

**File**: `.github/workflows/deploy-alternative.yml`

This is the simplest fix if you want to continue using the peaceiris action.

**Steps**:
1. ✅ The workflow has already been updated with proper permissions
2. Commit and push the changes
3. Trigger the workflow manually or push to main branch

**Key Changes Added**:
```yaml
permissions:
  contents: write  # Required for pushing to gh-pages branch
  pages: write     # Required for GitHub Pages
  id-token: write  # Required for OIDC authentication
```

### Solution 2: Use Official GitHub Pages Deployment (Recommended for New Projects)

**File**: `.github/workflows/deploy.yml`

This uses GitHub's official Pages deployment actions, which is more reliable and secure.

**Repository Setup**:
1. Go to **Repository Settings** → **Pages**
2. Set **Source** to **GitHub Actions**
3. Save settings

**Steps**:
1. ✅ The workflow is already configured
2. Ensure repository Pages settings are set to "GitHub Actions"
3. Trigger the workflow

### Solution 3: Use Personal Access Token (PAT)

**Use this when GITHUB_TOKEN permissions are restricted by organization policies**.

**Steps**:

1. **Create a Personal Access Token**:
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Click "Generate new token"
   - Select scopes: `repo` (full repository access)
   - Generate and copy the token

2. **Add PAT to Repository Secrets**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `PAT`
   - Paste the token value
   - Add secret

3. **Use the PAT Workflow**:
   - Use `.github/workflows/deploy-pat.yml`
   - This workflow uses `PAT` instead of `GITHUB_TOKEN`

## Detailed Implementation Steps

### Step 1: Configure Repository Settings

1. **Enable GitHub Pages**:
   - Navigate to **Repository Settings** → **Pages**
   - Set **Source** to **GitHub Actions** (recommended) or **Deploy from a branch**
   - If using "Deploy from a branch", select `gh-pages` and `/ (root)`

2. **Check Branch Protection** (if exists):
   - Go to **Settings** → **Branches** → **Branch protection rules**
   - If `gh-pages` branch has protection rules, ensure they allow:
     - `Allow force pushes`
     - `Restrict pushes` (should not be enabled for gh-pages)

### Step 2: Choose and Configure Your Workflow

#### Option A: Fixed Alternative Workflow (Easiest)
```bash
# The deploy-alternative.yml is already fixed
git add .github/workflows/deploy-alternative.yml
git commit -m "Fix GitHub Actions permissions for Pages deployment"
git push origin main
```

#### Option B: Official Pages Deployment (Most Reliable)
```bash
# Use the existing deploy.yml workflow
# Ensure repository Pages source is set to "GitHub Actions"
git add .github/workflows/deploy.yml
git commit -m "Configure official GitHub Pages deployment"
git push origin main
```

#### Option C: PAT-Based Deployment (Fallback)
```bash
# First create PAT secret in repository settings
# Then use the deploy-pat.yml workflow
git add .github/workflows/deploy-pat.yml
git commit -m "Add PAT-based GitHub Pages deployment"
git push origin main
```

### Step 3: Test Your Deployment

#### Manual Testing:
1. Go to **Actions** tab in your repository
2. Select your workflow (deploy, deploy-alternative, or deploy-pat)
3. Click "Run workflow" → "Run workflow"

#### Automated Testing:
```bash
# The debug-permissions.yml workflow can help diagnose issues
# Run it manually from the Actions tab
```

### Step 4: Verify Deployment

1. **Check Workflow Logs**:
   - Go to **Actions** tab
   - Click on the workflow run
   - Check all steps for errors

2. **Verify Pages Site**:
   - Visit: `https://wintrover.github.io/blog/`
   - Ensure your site loads correctly

3. **Check gh-pages Branch** (for peaceiris method):
   - Go to your repository's branch selector
   - Verify `gh-pages` branch exists and contains your built files

## Troubleshooting

### Common Error: "Permission denied"

**Solutions**:
1. **Check permissions section** in your workflow
2. **Verify repository Pages settings**
3. **Ensure workflow is triggered from main branch**
4. **Check organization restrictions** (might require PAT)

### Common Error: "Pages not configured"

**Solutions**:
1. **Enable GitHub Pages** in repository settings
2. **Set source to "GitHub Actions"** for official deployment
3. **Wait a few minutes** for GitHub to initialize

### Common Error: "Build failed"

**Solutions**:
1. **Check build logs** in Actions tab
2. **Verify package.json scripts** (`build:github`)
3. **Ensure all dependencies are installed** (`npm ci`)

### Debug Workflow

Run the debug workflow to diagnose issues:
1. Go to **Actions** → **Debug GitHub Actions Permissions**
2. Click "Run workflow"
3. Select test type: `basic`, `gh-pages-push`, or `pages-deploy`
4. Review the output to identify permission issues

## Best Practices

1. **Use Official Actions**: Prefer `actions/deploy-pages@v4` over third-party actions
2. **Minimal Permissions**: Only request necessary permissions
3. **Environment Variables**: Use environment variables for configuration
4. **Artifact Caching**: Use `actions/upload-pages-artifact@v3` for reliable deployments
5. **Monitor Workflow**: Check logs regularly for issues

## File Locations

- **Main workflow**: `D:\Coding\blog\.github\workflows\deploy.yml`
- **Alternative workflow**: `D:\Coding\blog\.github\workflows\deploy-alternative.yml`
- **PAT workflow**: `D:\Coding\blog\.github\workflows\deploy-pat.yml`
- **Debug workflow**: `D:\Coding\blog\.github\workflows\debug-permissions.yml`
- **Build script**: `D:\Coding\blog\package.json` (scripts section)
- **Local deployment**: `D:\Coding\blog\deploy-github.js`