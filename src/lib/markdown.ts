import { marked } from "marked";
import mermaid from "mermaid";

const postFiles = {
	"how-i-built-cvfactory": "/blog/_posts/2025-06-25-1.md",
	"cvfactory-backend-celery-fastapi-playwright": "/blog/_posts/2025-06-29-2.md",
	"svelte-django-practical-checklist": "/blog/_posts/2025-07-01-3.md",
	"sonarqube-community-edition-grade-a-quality": "/blog/_posts/2025-07-06-4.md",
	"junior-developer-google-login-implementation":
		"/blog/_posts/2025-07-18-5.md",
	"facial-authentication-system-development": "/blog/_posts/2025-08-05-6.md",
	"kyc-system-completion-and-growth": "/blog/_posts/2025-08-10-7.md",
};

const BASE =
	typeof import.meta !== "undefined" &&
	import.meta.env &&
	import.meta.env.BASE_URL
		? import.meta.env.BASE_URL
		: "/blog/";

function joinBase(p: unknown) {
	return `${String(BASE).replace(/\/$/, "")}/${String(p).replace(/^\//, "")}`;
}

export function normalizeImageSrc(src: any) {
	if (!src || typeof src !== "string") return src;
	if (/^(https?:\/\/|data:)/i.test(src)) return src;

	let p = src;
	if (p.startsWith("/blog/")) {
		p = p.slice("/blog/".length);
	} else if (p.startsWith(BASE)) {
		p = p.slice(BASE.length);
	} else if (p.startsWith("/")) {
		p = p.slice(1);
	}

	// Resolve .. and . first (EP-BVA boundary case handling)
	p = resolveRelativePath(p);

	if (p.startsWith("assets/images/")) {
		p = flattenLegacyAssetsPath(p);
	} else if (p.startsWith("images/")) {
		// already normalized to images/
	}

	return joinBase(p);
}

function resolveRelativePath(p: string) {
	const parts = p.split("/");
	const stack: string[] = [];
	for (const part of parts) {
		if (part === "..") {
			if (stack.length > 0) stack.pop();
		} else if (part !== "." && part !== "") {
			stack.push(part);
		}
	}
	const result = stack.join("/");
	return p.startsWith("/") ? `/${result}` : result;
}

function flattenLegacyAssetsPath(p: string) {
	const rest = p.replace(/^assets\/images\//, "");
	const parts = rest.split("/");
	if (parts.length >= 2) {
		const first = parts[0];
		const filename = parts.slice(1).join("/");
		if (/^\d{2}$/.test(first)) {
			return `images/${first}-${filename}`;
		}
		return `images/${filename}`;
	}
	return `images/${rest}`;
}

export async function loadPost(slug: string) {
	const filePath = (postFiles as Record<string, string>)[slug];
	if (!filePath) {
		return null;
	}
	try {
		const response = await fetch(filePath);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
		}
		const content = await response.text();
		return parseMarkdown(content);
	} catch (error) {
		console.error("❌ [markdown] 포스트 로딩 중 에러 발생:", {
			slug,
			filePath,
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : "Stack trace unavailable",
			error,
		});
		return null;
	}
}

export function parseMarkdown(content: string) {
	const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
	const match = content.match(frontMatterRegex);
	if (!match) {
		try {
			const htmlRaw = marked.parse(content, { async: false }) as string;
			return {
				frontMatter: {},
				html: htmlRaw.replace(
					/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/g,
					(m: string, src: string) => {
						const fixed = normalizeImageSrc(src);
						return m.replace(src, fixed);
					},
				),
			};
		} catch (error) {
			console.error(
				"❌ [markdown] 마크다운 파싱 중 에러 발생 (No FrontMatter):",
				{
					message: error instanceof Error ? error.message : String(error),
					stack:
						error instanceof Error ? error.stack : "Stack trace unavailable",
					error,
				},
			);
			return { frontMatter: {}, html: `<p>Error parsing markdown content</p>` };
		}
	}
	const [, frontMatterStr, markdownContent] = match;
	try {
		const frontMatter = parseFrontMatter(frontMatterStr);
		const htmlRaw = marked.parse(markdownContent, { async: false }) as string;
		const html = htmlRaw.replace(
			/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/g,
			(m: string, src: string) => {
				const fixed = normalizeImageSrc(src);
				return m.replace(src, fixed);
			},
		);
		return {
			frontMatter,
			html,
		};
	} catch (error) {
		console.error("❌ [markdown] 마크다운 파싱 중 에러 발생:", {
			frontMatterStr,
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : "Stack trace unavailable",
			error,
		});
		return { frontMatter: {}, html: `<p>Error parsing markdown content</p>` };
	}
}

function parseFrontMatter(str: string) {
	const lines = str.split("\n");
	const result: Record<string, any> = {};
	for (const line of lines) {
		const colonIndex = line.indexOf(":");
		if (colonIndex > 0) {
			const key = line.slice(0, colonIndex).trim();
			let value = line.slice(colonIndex + 1).trim();
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}
			if (key === "tags" && value.includes(" ")) {
				result[key] = value.split(" ").map((tag) => tag.trim());
			} else {
				result[key] = value;
			}
		}
	}
	return result;
}

const renderer = new marked.Renderer();

if (typeof window !== "undefined") {
	try {
		mermaid.initialize({
			startOnLoad: false,
			theme: "default",
			securityLevel: "loose",
		});
	} catch (e) {
		console.error("❌ [markdown] Mermaid 초기화 중 에러 발생:", {
			message: e instanceof Error ? e.message : String(e),
			stack: e instanceof Error ? e.stack : "Stack trace unavailable",
			error: e,
		});
	}
}

renderer.image = (href: string, title: string | null, text: string) => {
	const normalized = normalizeImageSrc(href);
	let out = `<img src="${normalized}" alt="${text}"`;
	if (title) {
		out += ` title="${title}"`;
	}
	out += " />";
	return out;
};

renderer.code = (code: string, language: string | undefined) => {
	if (language === "mermaid") {
		const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
		return `<div class="mermaid-diagram" data-mermaid-code="${encodeURIComponent(code)}" id="${id}">${code}</div>`;
	}
	const escapedCode = code
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
	const buttonsContainer = `
    <div class="devsite-code-buttons-container" role="group" aria-label="Action buttons">
      <button type="button" class="devsite-icon-theme-toggle" aria-label="Toggle theme" data-title="Toggle theme"></button>
      <button type="button" class="devsite-icon-copy" aria-label="Copy code sample" data-title="Copy code sample"></button>
    </div>
  `;
	return `<pre>${buttonsContainer}<code${language ? ` class="language-${language}"` : ""}>${escapedCode}</code></pre>`;
};

marked.setOptions({
	breaks: true,
	gfm: true,
	renderer: renderer,
});
