export interface Post {
  fileName: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
  content: string; // Markdown content
  folder: string;
  html?: string; // HTML content, optional as it's added later
  [key: string]: any; // For additional front matter data
}