import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

async function postToDev(filePath) {
  const devtoApiKey = process.env.DEVTO_API_KEY;

  if (!devtoApiKey) {
    console.error('DEVTO_API_KEY is not set.');
    process.exit(1);
  }

  try {
    const markdownWithMeta = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(markdownWithMeta);

    const article = {
      title: frontmatter.title,
      published: false,
      body_markdown: content,
      tags: frontmatter.tags || [],
    };

    const response = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': devtoApiKey,
      },
      body: JSON.stringify({ article }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`Successfully created draft: ${result.url}`);
    } else {
      const error = await response.json();
      console.error('Failed to create draft:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

const postFilePath = process.argv[2];
if (!postFilePath) {
  console.error('Please provide a path to a markdown file.');
  process.exit(1);
}

postToDev(path.resolve(postFilePath));