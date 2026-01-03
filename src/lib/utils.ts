const BASE = "/blog/";

function joinBase(p: unknown) {
	return `${String(BASE).replace(/\/$/, "")}/${String(p).replace(/^\//, "")}`;
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

export function normalizeImageSrc(src: any) {
	if (!src || typeof src !== "string") return src;
	if (/^(https?:\/\/|data:)/i.test(src)) return src;

	let p = src;
	if (p.startsWith(BASE)) {
		p = p.slice(BASE.length);
	} else if (p.startsWith("/")) {
		p = p.slice(1);
	}

	p = resolveRelativePath(p);

	if (p.startsWith("assets/images/")) {
		p = flattenLegacyAssetsPath(p);
	}

	return joinBase(p);
}

export function formatDate(dateString: string) {
	const date = new Date(dateString);
	return date.toLocaleDateString("ko-KR", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

export function truncateText(text: string, wordLimit = 30) {
	if (!text) return "";
	const stripped = text.replace(/<[^>]*>/g, "");
	const words = stripped.split(/\s+/).filter(Boolean);
	if (words.length <= wordLimit) return stripped.trim();
	return `${words.slice(0, wordLimit).join(" ")}...`;
}

export function slugify(text: string) {
	if (!text) return "";
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function parseFrontMatter(content: string) {
	const parts = content.split(/^---\s*$/m);
	if (parts.length >= 3) {
		const frontMatter = parts[1];
		const body = parts.slice(2).join("---").trim();
		const data: Record<string, any> = {};
		const lines = frontMatter.split("\n");
		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith("#")) {
				const colonIndex = trimmed.indexOf(":");
				if (colonIndex > 0) {
					const key = trimmed.substring(0, colonIndex).trim();
					let value = trimmed.substring(colonIndex + 1).trim();
					if (
						(value.startsWith('"') && value.endsWith('"')) ||
						(value.startsWith("'") && value.endsWith("'"))
					) {
						value = value.slice(1, -1);
					}

					if (key === "tags") {
						data[key] = value.split(/[,\s]+/).filter(Boolean);
					} else if (value === "true") {
						data[key] = true;
					} else if (value === "false") {
						data[key] = false;
					} else if (value !== "" && !Number.isNaN(Number(value))) {
						data[key] = Number(value);
					} else {
						data[key] = value;
					}
				}
			}
		}
		return { data, content: body };
	}
	return { data: {}, content };
}
