import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

/**
 * Convert Mermaid diagram to PNG image using Puppeteer
 * @param {string} mermaidCode - The Mermaid diagram code
 * @param {string} outputPath - Output path for the PNG image
 * @returns {Promise<string>} - Path to the generated image
 */
export async function convertMermaidToImage(mermaidCode, outputPath) {
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Create HTML template with Mermaid
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11.9.0/dist/mermaid.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: white;
            font-family: Arial, sans-serif;
        }
        .mermaid {
            display: flex;
            justify-content: center;
            align-items: center;
        }
    </style>
</head>
<body>
    <div class="mermaid">
${mermaidCode}
    </div>
    <script>
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            themeVariables: {
                primaryColor: '#ffffff',
                primaryTextColor: '#333333',
                primaryBorderColor: '#cccccc',
                lineColor: '#333333',
                secondaryColor: '#f8f9fa',
                tertiaryColor: '#e9ecef'
            },
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            },
            sequence: {
                useMaxWidth: true,
                diagramMarginX: 50,
                diagramMarginY: 10,
                actorMargin: 50,
                width: 150,
                height: 65,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35,
                mirrorActors: true,
                bottomMarginAdj: 1,
                wrap: true
            }
        });
    </script>
</body>
</html>`;

    // Set content and wait for Mermaid to render
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

    // Wait a bit more for Mermaid to complete rendering
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get the Mermaid diagram element
    const mermaidElement = await page.$('.mermaid');
    if (!mermaidElement) {
        throw new Error('Mermaid diagram not found');
    }

    // Take screenshot of the diagram
    await mermaidElement.screenshot({
      path: outputPath,
      type: 'png',
      omitBackground: false
    });

    return outputPath;

  } catch (error) {
    console.error('Error converting Mermaid to image:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extract Mermaid blocks from markdown content
 * @param {string} markdown - The markdown content
 * @returns {Array} - Array of {code, startIndex, endIndex} objects
 */
export function extractMermaidBlocks(markdown) {
  const mermaidBlocks = [];
  // More flexible regex to handle different line endings and spacing
  const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/g;
  let match;

  while ((match = mermaidRegex.exec(markdown)) !== null) {
    mermaidBlocks.push({
      code: match[1].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  return mermaidBlocks;
}

/**
 * Process markdown content and convert Mermaid diagrams to images
 * @param {string} markdown - The markdown content
 * @param {string} publicBaseUrl - Base URL for public assets
 * @param {string} outputDir - Directory to save generated images
 * @returns {Promise<{content: string, images: Array}>} - Processed content and image paths
 */
export async function processMermaidDiagrams(markdown, publicBaseUrl, outputDir = 'assets/images/mermaid') {
  const mermaidBlocks = extractMermaidBlocks(markdown);

  if (mermaidBlocks.length === 0) {
    return { content: markdown, images: [] };
  }

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  let processedContent = markdown;
  const images = [];

  // Process blocks in reverse order to avoid index shifting
  for (let i = mermaidBlocks.length - 1; i >= 0; i--) {
    const block = mermaidBlocks[i];

    try {
      // Generate unique filename
      const filename = `mermaid-${crypto.randomBytes(8).toString('hex')}.png`;
      const imagePath = path.join(outputDir, filename);
      // Remove 'public' prefix and any leading './' from outputDir for URL generation
      let urlPath = outputDir;
      if (urlPath.startsWith('./public/')) {
        urlPath = urlPath.substring(8); // Remove './public/'
      } else if (urlPath.startsWith('public/')) {
        urlPath = urlPath.substring(7); // Remove 'public/'
      } else if (urlPath.startsWith('./')) {
        urlPath = urlPath.substring(2); // Remove './'
      }
      const baseUrl = publicBaseUrl.replace(/\/$/, '');
      // Ensure proper URL encoding for paths
      urlPath = urlPath.replace(/\\/g, '/'); // Replace backslashes with forward slashes
      // Remove any duplicate 'public/' from the path
      if (urlPath.startsWith('public/')) {
        urlPath = urlPath.substring(7);
      }
      const imageUrl = `${baseUrl}/${urlPath.replace(/^\//, '')}/${filename}`;

      // Convert Mermaid to image
      await convertMermaidToImage(block.code, imagePath);

      // Replace Mermaid block with image
      const imageMarkdown = `![Mermaid Diagram](${imageUrl})`;
      processedContent = processedContent.substring(0, block.startIndex) +
                        imageMarkdown +
                        processedContent.substring(block.endIndex);

      images.push({
        path: imagePath,
        url: imageUrl,
        filename: filename
      });

      console.log(`✅ Converted Mermaid diagram to image: ${filename}`);

    } catch (error) {
      console.error(`❌ Failed to convert Mermaid diagram:`, error);

      // Keep original Mermaid block if conversion fails
      const fallbackMarkdown = `> ⚠️ **Mermaid Diagram Could Not Be Rendered**\n\n\`\`\`mermaid\n${block.code}\n\`\`\``;
      processedContent = processedContent.substring(0, block.startIndex) +
                        fallbackMarkdown +
                        processedContent.substring(block.endIndex);
    }
  }

  return {
    content: processedContent,
    images: images
  };
}