#!/usr/bin/env node

/**
 * GitHub Pages Deployment Testing Script
 *
 * This script helps verify that your local setup is ready for GitHub Pages deployment
 * and provides guidance on testing the deployment process.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      log(`✅ ${description}: Found`, 'green');
      return true;
    } else {
      log(`❌ ${description}: Not found at ${filePath}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${description}: Error checking file - ${error.message}`, 'red');
    return false;
  }
}

function checkJsonFile(filePath, description, requiredFields = []) {
  try {
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      log(`✅ ${description}: Valid JSON`, 'green');

      let allFieldsPresent = true;
      for (const field of requiredFields) {
        if (content[field]) {
          log(`   ✅ Found field: ${field}`, 'green');
        } else {
          log(`   ❌ Missing field: ${field}`, 'red');
          allFieldsPresent = false;
        }
      }
      return allFieldsPresent;
    } else {
      log(`❌ ${description}: File not found`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${description}: Invalid JSON - ${error.message}`, 'red');
    return false;
  }
}

function checkWorkflow(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for required workflow elements
      const checks = [
        { pattern: /permissions:/, description: 'Has permissions section' },
        { pattern: /contents:\s*write/, description: 'Has contents: write permission' },
        { pattern: /peaceiris\/actions-gh-pages/, description: 'Uses peaceiris action' },
        { pattern: /actions\/deploy-pages/, description: 'Uses official Pages action' }
      ];

      log(`✅ ${description}: Workflow file found`, 'green');

      for (const check of checks) {
        if (content.match(check.pattern)) {
          log(`   ✅ ${check.description}`, 'green');
        } else {
          log(`   ⚠️  ${check.description}`, 'yellow');
        }
      }
      return true;
    } else {
      log(`❌ ${description}: Workflow file not found`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${description}: Error reading workflow - ${error.message}`, 'red');
    return false;
  }
}

function runCommand(command, description, allowedToFail = false) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description}`, 'green');
    return true;
  } catch (error) {
    if (allowedToFail) {
      log(`⚠️  ${description}: ${error.message}`, 'yellow');
      return true; // Still return true for non-critical failures
    } else {
      log(`❌ ${description}: ${error.message}`, 'red');
      return false;
    }
  }
}

async function main() {
  log('\n🚀 GitHub Pages Deployment Setup Test', 'cyan');
  log('=====================================\n');

  let allChecksPass = true;

  // 1. Check essential project files
  log('📁 Checking Project Structure', 'blue');
  log('----------------------------', 'blue');

  const fileChecks = [
    { path: 'package.json', desc: 'Package configuration' },
    { path: 'vite.config.js', desc: 'Vite configuration' },
    { path: '404.html', desc: '404 error page' },
    { path: 'index.html', desc: 'Main HTML file' }
  ];

  for (const check of fileChecks) {
    const result = checkFile(check.path, check.desc);
    allChecksPass = allChecksPass && result;
  }

  // 2. Check package.json scripts
  log('\n📜 Checking Build Scripts', 'blue');
  log('-------------------------', 'blue');

  const packageCheck = checkJsonFile('package.json', 'Package scripts', ['scripts']);
  if (packageCheck) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = packageJson.scripts;

      const requiredScripts = ['build', 'build:github', 'dev'];
      for (const script of requiredScripts) {
        if (scripts[script]) {
          log(`   ✅ Script found: ${script}`, 'green');
        } else {
          log(`   ⚠️  Script missing: ${script}`, 'yellow');
        }
      }
    } catch (error) {
      log(`   ❌ Error checking scripts: ${error.message}`, 'red');
      allChecksPass = false;
    }
  }

  // 3. Check workflow files
  log('\n🔄 Checking GitHub Workflows', 'blue');
  log('---------------------------', 'blue');

  const workflowChecks = [
    { path: '.github/workflows/deploy.yml', desc: 'Official Pages deployment' },
    { path: '.github/workflows/deploy-alternative.yml', desc: 'Alternative deployment' },
    { path: '.github/workflows/deploy-pat.yml', desc: 'PAT-based deployment' },
    { path: '.github/workflows/debug-permissions.yml', desc: 'Debug workflow' }
  ];

  for (const check of workflowChecks) {
    checkWorkflow(check.path, check.desc);
  }

  // 4. Check git configuration
  log('\n🔧 Checking Git Configuration', 'blue');
  log('------------------------------', 'blue');

  const gitChecks = [
    { cmd: 'git --version', desc: 'Git is installed' },
    { cmd: 'git remote -v', desc: 'Git remotes configured' },
    { cmd: 'git status --porcelain', desc: 'Git working directory', true }
  ];

  for (const check of gitChecks) {
    const result = runCommand(check.cmd, check.desc, check.allowedToFail);
    allChecksPass = allChecksPass && result;
  }

  // 5. Test build process locally
  log('\n🏗️  Testing Build Process', 'blue');
  log('-------------------------', 'blue');

  try {
    log('   Running: npm install', 'yellow');
    execSync('npm install', { stdio: 'pipe' });
    log('✅ Dependencies installed', 'green');

    log('   Running: npm run build:github', 'yellow');
    execSync('npm run build:github', { stdio: 'pipe' });
    log('✅ Build completed successfully', 'green');

    // Check if dist directory was created
    if (checkFile('dist/index.html', 'Built index.html') &&
        checkFile('dist/404.html', 'Copied 404.html')) {
      log('✅ Build output verified', 'green');
    } else {
      log('❌ Build output verification failed', 'red');
      allChecksPass = false;
    }

  } catch (error) {
    log(`❌ Build failed: ${error.message}`, 'red');
    allChecksPass = false;
  }

  // 6. Summary and next steps
  log('\n📊 Test Summary', 'cyan');
  log('================', 'cyan');

  if (allChecksPass) {
    log('🎉 All checks passed! Your setup is ready for deployment.', 'green');
    log('\n📋 Next Steps:', 'blue');
    log('1. Commit and push your changes:', 'yellow');
    log('   git add .');
    log('   git commit -m "Configure GitHub Pages deployment"');
    log('   git push origin main');
    log('\n2. Configure repository settings:', 'yellow');
    log('   - Go to Settings → Pages');
    log('   - Set Source to "GitHub Actions"');
    log('\n3. Trigger deployment:', 'yellow');
    log('   - Push to main branch OR');
    log('   - Run workflow manually from Actions tab');
    log('\n4. Monitor deployment:', 'yellow');
    log('   - Check Actions tab for workflow status');
    log('   - Visit https://wintrover.github.io/blog/ when complete');

  } else {
    log('❌ Some checks failed. Please fix the issues above before deploying.', 'red');
    log('\n🔧 Troubleshooting:', 'blue');
    log('1. Install missing dependencies: npm install');
    log('2. Check build script in package.json');
    log('3. Verify workflow files exist and have proper permissions');
    log('4. Ensure git repository is properly initialized');
    log('5. Run debug workflow to diagnose permission issues');
  }

  log('\n📖 For detailed setup instructions, see: GITHUB_PAGES_SETUP_GUIDE.md', 'cyan');
  log('\n🐛 Debug workflow available: .github/workflows/debug-permissions.yml', 'cyan');
}

// Run the test
main().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});