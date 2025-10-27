import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Convert SVG to PNG using Puppeteer
 * @param {string} svgFilePath - Path to SVG file
 * @param {string} outputPath - Output path for PNG image
 * @returns {Promise<string>} - Path to generated PNG
 */
export async function convertSvgToPng(svgFilePath, outputPath) {
  let browser;
  try {
    // Read SVG content
    const svgContent = await fs.readFile(svgFilePath, 'utf-8');

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: 1000,
      height: 600,
      deviceScaleFactor: 2
    });

    // Create HTML template
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: white;
        }
        svg {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
    </html>`;

    // Set content
    await page.setContent(htmlTemplate);

    // Take screenshot
    await page.screenshot({
      path: outputPath,
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 1000,
        height: 560
      }
    });

    console.log(`✅ Converted SVG to PNG: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// CLI execution
if (process.argv[1] && path.basename(process.argv[1]) === 'svg-to-png.js') {
  const svgPath = process.argv[2];
  const pngPath = process.argv[3];

  if (!svgPath || !pngPath) {
    console.error('Usage: node svg-to-png.js <input-svg> <output-png>');
    process.exit(1);
  }

  convertSvgToPng(svgPath, pngPath)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}