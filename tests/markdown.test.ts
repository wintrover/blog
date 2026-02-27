import { marked } from "marked";
import mermaid from "mermaid";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initMermaid, loadPost, parseMarkdown } from "../src/lib/markdown";

const originalFetch = global.fetch;

vi.mock("mermaid", () => ({
	default: {
		initialize: vi.fn(),
	},
}));

vi.mock("marked", async (importActual) => {
	const actual = await importActual<typeof import("marked")>();
	return {
		...actual,
		marked: {
			...actual.marked,
			parse: vi.fn(),
		},
	};
});

describe("markdown utilities", () => {
	beforeEach(async () => {
		vi.resetAllMocks();
		const actual = await vi.importActual<typeof import("marked")>("marked");
		vi.mocked(marked.parse).mockImplementation(actual.marked.parse as any);
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	describe("parseMarkdown", () => {
		test("EP-BVA: 기본 마크다운 파싱", () => {
			const md = "---\ntitle: Test\n---\n# Hello\nWorld";
			const result = parseMarkdown(md);
			expect(result.frontMatter).toEqual({ title: "Test" });
			expect(result.html).toContain("<h1>Hello</h1>");
			expect(result.html).toContain("<p>World</p>");
		});

		test("EP-BVA: 이미지 경로 정규화 확인", () => {
			const md = '---\ntitle: Test\n---\n<img src="assets/images/test.png">';
			const result = parseMarkdown(md);
			expect(result.html).toContain('src="/blog/images/test.png"');
		});

		test("EP-BVA: 파싱 에러 처리 (Line 53-63) - Error 객체", () => {
			vi.mocked(marked.parse).mockImplementation(() => {
				throw new Error("Mocked Parse Error");
			});

			const md = "some content";
			const result = parseMarkdown(md);
			expect(result.frontMatter).toEqual({});
			expect(result.html).toContain(
				"Error parsing markdown: Mocked Parse Error",
			);
		});

		test("EP-BVA: 파싱 에러 처리 (Line 53-63) - Non-Error 객체", () => {
			vi.mocked(marked.parse).mockImplementation(() => {
				throw "String Error";
			});

			const md = "some content";
			const result = parseMarkdown(md);
			expect(result.frontMatter).toEqual({});
			expect(result.html).toContain("Error parsing markdown: String Error");
		});
	});

	describe("initMermaid", () => {
		test("EP-BVA: Mermaid 초기화 확인 (Line 67)", () => {
			initMermaid();
			expect(mermaid.initialize).toHaveBeenCalledWith({
				startOnLoad: true,
				theme: "default",
				securityLevel: "loose",
			});
		});
	});

	describe("loadPost", () => {
		test("EP-BVA: 존재하지 않는 슬러그 (Line 13-15)", async () => {
			const result = await loadPost("non-existent");
			expect(result).toBeNull();
		});

		test("EP-BVA: 성공적인 로드 (Line 22)", async () => {
			const slug = "../posts/project/2025-06-25-1.md";
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve("---\ntitle: Test\n---\nContent"),
			});
			const result = await loadPost(slug);
			expect(result).not.toBeNull();
			expect(result?.frontMatter.title).toBe("Test");
		});

		test("EP-BVA: fetch 실패 (Line 18-20)", async () => {
			const slug = "../posts/project/2025-06-25-1.md";
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
			});
			const result = await loadPost(slug);
			expect(result).toBeNull();
		});

		test("EP-BVA: 예외 발생 시 처리 (Line 23-32)", async () => {
			const slug = "../posts/project/2025-06-25-1.md";
			global.fetch = vi.fn().mockImplementation(() => {
				throw new Error("Network Error");
			});
			const result = await loadPost(slug);
			expect(result).toBeNull();
		});

		test("EP-BVA: non-Error 예외 발생 시 처리 (Line 27-28 else)", async () => {
			const slug = "../posts/project/2025-06-25-1.md";
			global.fetch = vi.fn().mockImplementation(() => {
				throw "String Error";
			});
			const result = await loadPost(slug);
			expect(result).toBeNull();
		});
	});
});
