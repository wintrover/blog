import categoryConfig from "./categories.json";
import { parseMarkdown } from "./markdown";
import { parseFrontMatter, slugify } from "./utils";

function determineCategoryFromPath(path: string) {
	const pathParts = path.split("/");
	const folderName = pathParts[pathParts.length - 2];
	const folderMapping: Record<string, string> = {
		project: "Project",
		company: "Company Work",
		tutorial: "Tutorial",
		general: "General",
	};
	return folderMapping[folderName] || (categoryConfig as any).defaultCategory;
}

export async function loadAllPosts() {
	try {
		const modules = import.meta.glob("../posts/**/*.md", {
			eager: true,
			query: "?raw",
			import: "default",
		}) as Record<string, string>;

		const posts: any[] = [];
		for (const path in modules) {
			try {
				const content = modules[path];
				const fileName = path.split("/").pop()?.replace(".md", "");
				const { data, content: markdownContent } = parseFrontMatter(content);
				let category = (data as any).category;
				if ((categoryConfig as any).autoAssignByFolder && !category) {
					category = determineCategoryFromPath(path);
				}
				const post = {
					fileName,
					slug: slugify((data as any).title || fileName || ""),
					title: (data as any).title || fileName,
					date: (data as any).date || new Date().toISOString().split("T")[0],
					category: category || (categoryConfig as any).defaultCategory,
					tags: (data as any).tags || [],
					excerpt: (data as any).excerpt || (data as any).description || "",
					content: markdownContent,
					folder: path.split("/")[path.split("/").length - 2],
					...data,
				};
				posts.push(post);
			} catch (postError) {
				console.error(`❌ [postLoader] 포스트 파싱 중 에러 발생 (${path}):`, {
					message:
						postError instanceof Error ? postError.message : String(postError),
					stack:
						postError instanceof Error
							? postError.stack
							: "Stack trace unavailable",
					error: postError,
				});
			}
		}

		return posts.sort(
			(a, b) =>
				new Date(b.date as any).getTime() - new Date(a.date as any).getTime(),
		);
	} catch (error) {
		console.error("❌ [postLoader] 포스트 로딩 중 치명적 에러 발생:", {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : "Stack trace unavailable",
			error,
		});
		return [];
	}
}

export async function loadPostBySlug(slug: string) {
	try {
		const modules = import.meta.glob("../posts/**/*.md", {
			eager: true,
			query: "?raw",
			import: "default",
		}) as Record<string, string>;

		let targetContent: string | null = null;
		let targetFileName: string | null = null;

		for (const path in modules) {
			const content = modules[path];
			const fileName = path.split("/").pop()?.replace(".md", "") ?? "unknown";
			const { data } = parseFrontMatter(content);
			const postSlug = slugify((data as any).title || fileName || "");
			if (postSlug === slug) {
				targetContent = content;
				targetFileName = fileName;
				break;
			}
		}

		if (!targetContent || !targetFileName) {
			console.warn(
				`⚠️ [postLoader] 해당 슬러그에 대한 포스트를 찾을 수 없음: ${slug}`,
			);
			return null;
		}

		const { data, content: markdownContent } = parseFrontMatter(targetContent);
		const { html: htmlContent } = parseMarkdown(targetContent);

		return {
			fileName: targetFileName,
			slug,
			title: (data as any).title || targetFileName,
			date: (data as any).date || new Date().toISOString().split("T")[0],
			category: (data as any).category || "general",
			tags: (data as any).tags || [],
			excerpt: (data as any).excerpt || (data as any).description || "",
			content: markdownContent,
			html: htmlContent,
			...data,
		};
	} catch (error) {
		console.error(
			`❌ [postLoader] 슬러그(${slug})로 포스트 로딩 중 에러 발생:`,
			{
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : "Stack trace unavailable",
				error,
			},
		);
		return null;
	}
}
