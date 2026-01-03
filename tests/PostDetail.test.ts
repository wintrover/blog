import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { push } from "svelte-spa-router";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import PostDetail from "../src/components/PostDetail.svelte";
import * as postLoader from "../src/lib/postLoader";

// Mock postLoader
vi.mock("../src/lib/postLoader", () => ({
	loadPostBySlug: vi.fn(),
}));

// Mock svelte-spa-router
vi.mock("svelte-spa-router", () => ({
	push: vi.fn(),
}));

// Mock mermaid
vi.mock("mermaid", () => ({
	default: {
		initialize: vi.fn(),
		run: vi.fn(),
		render: vi.fn(),
	},
}));

describe("PostDetail Component", () => {
	const mockPost = {
		fileName: "detailed-post",
		title: "Detailed Post",
		slug: "detailed-post",
		category: "Tech",
		date: "2023-10-01",
		content: "Body content",
		html: "<h1>Header</h1><p>Body content</p>",
		excerpt: "Detailed excerpt",
		tags: ["svelte", "testing"],
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(postLoader.loadPostBySlug).mockResolvedValue(mockPost as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test("포스트 내용을 올바르게 렌더링해야 함", async () => {
		const pushMock = vi.mocked(push);
		render(PostDetail, { params: { slug: "detailed-post" } });

		await waitFor(() => {
			expect(screen.getByText("Detailed Post")).toBeInTheDocument();
		});

		expect(screen.getByText("Tech")).toBeInTheDocument();
		expect(screen.getByText("Header")).toBeInTheDocument();
		expect(screen.getByText("Body content")).toBeInTheDocument();
		expect(screen.getByText("#svelte")).toBeInTheDocument();
		expect(screen.getByText("#testing")).toBeInTheDocument();

		// Back to List 버튼 클릭
		const backButton = screen.getByText("← Back to List");
		await fireEvent.click(backButton);
		expect(pushMock).toHaveBeenCalledWith("/");
	});

	test("포스트 전환 시 로딩 상태 표시 확인", async () => {
		let resolveFirst: (value: any) => void = () => {};
		const firstPromise = new Promise((resolve) => {
			resolveFirst = resolve;
		});
		vi.mocked(postLoader.loadPostBySlug).mockReturnValueOnce(
			firstPromise as any,
		);

		const { rerender } = render(PostDetail, { params: { slug: "first" } });

		// 첫 번째 포스트 로딩 중
		expect(screen.getByText("Loading post...")).toBeInTheDocument();
		resolveFirst(mockPost);
		await waitFor(() =>
			expect(screen.queryByText("Loading post...")).not.toBeInTheDocument(),
		);

		// 두 번째 포스트 로딩 시작
		let resolveSecond: (value: any) => void = () => {};
		const secondPromise = new Promise((resolve) => {
			resolveSecond = resolve;
		});
		vi.mocked(postLoader.loadPostBySlug).mockReturnValueOnce(
			secondPromise as any,
		);

		await rerender({ params: { slug: "second" } });

		// post가 있는 상태에서 loading이 true이므로 "Loading post content..."가 보여야 함
		expect(screen.getByText("Loading post content...")).toBeInTheDocument();

		resolveSecond({ ...mockPost, title: "Second Post" });
		await waitFor(() =>
			expect(screen.getByText("Second Post")).toBeInTheDocument(),
		);
	});

	test("goBack 함수 호출 확인", async () => {
		const pushSpy = (await import("svelte-spa-router")).push;
		render(PostDetail, { params: { slug: "detailed-post" } });

		await waitFor(() =>
			expect(screen.getByText("Detailed Post")).toBeInTheDocument(),
		);

		const backButton = screen.getByText("← Back to List");
		await fireEvent.click(backButton);
		expect(pushSpy).toHaveBeenCalledWith("/");
	});

	test("Mermaid 다이어그램 렌더링 확인", async () => {
		const mockPostWithMermaid = {
			...mockPost,
			html: '<div class="markdown-content"><div class="mermaid-diagram" id="mermaid-1" data-mermaid-code="graph%20TD%3B%20A--%3EB%3B"></div></div>',
		};
		vi.mocked(postLoader.loadPostBySlug).mockResolvedValue(
			mockPostWithMermaid as any,
		);

		const mermaid = (await import("mermaid")).default;
		const renderSpy = vi
			.mocked(mermaid.render)
			.mockResolvedValue({ svg: "<svg>mermaid</svg>" } as any);

		render(PostDetail, { params: { slug: "detailed-post" } });

		await waitFor(() => {
			expect(screen.queryByText("Detailed Post")).toBeInTheDocument();
		});

		await waitFor(
			() => {
				const mermaidElement = document.getElementById("mermaid-1");
				expect(mermaidElement?.innerHTML).toContain("<svg>mermaid</svg>");
			},
			{ timeout: 10000 },
		);

		expect(renderSpy).toHaveBeenCalled();
	});

	test("코드 블록 테마 토글 및 복사 버튼 확인", async () => {
		const mockPostWithCode = {
			...mockPost,
			html: `
				<div class="markdown-content">
					<pre>
						<button class="devsite-icon-theme-toggle"></button>
						<button class="devsite-icon-copy"></button>
						<code>console.log("hello");</code>
					</pre>
				</div>
			`,
		};
		vi.mocked(postLoader.loadPostBySlug).mockResolvedValue(
			mockPostWithCode as any,
		);

		render(PostDetail, { params: { slug: "detailed-post" } });

		await waitFor(() => {
			expect(screen.queryByText("Detailed Post")).toBeInTheDocument();
		});

		await waitFor(
			() => {
				const themeToggle = document.querySelector(
					".devsite-icon-theme-toggle",
				);
				expect(themeToggle).toBeInTheDocument();
			},
			{ timeout: 5000 },
		);

		const themeToggle = document.querySelector(".devsite-icon-theme-toggle");
		const copyButton = document.querySelector(".devsite-icon-copy");
		const pre = document.querySelector("pre");

		if (themeToggle && pre) {
			await fireEvent.click(themeToggle);
			expect(pre.classList.contains("dark-theme")).toBe(true);
			expect(themeToggle.classList.contains("light-mode")).toBe(true);
		}

		if (copyButton) {
			const writeTextMock = vi.fn().mockResolvedValue(undefined);
			Object.assign(navigator, {
				clipboard: {
					writeText: writeTextMock,
				},
			});

			await fireEvent.click(copyButton);
			expect(writeTextMock).toHaveBeenCalledWith('console.log("hello");');
		}
	});

	test("포스트 로드 실패 시 에러 처리", async () => {
		vi.mocked(postLoader.loadPostBySlug).mockResolvedValue(null as any);
		render(PostDetail, { params: { slug: "detailed-post" } });

		await waitFor(() => {
			expect(screen.getByText(/Post not found/i)).toBeInTheDocument();
		});

		// Go back to home 버튼 클릭
		const backButton = screen.getByText("Go back to home");
		await fireEvent.click(backButton);
		expect(push).toHaveBeenCalledWith("/");
	});

	test("포스트 로드 중 에러 발생 시 처리", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		vi.mocked(postLoader.loadPostBySlug).mockRejectedValue(
			new Error("Network Error"),
		);

		render(PostDetail, { params: { slug: "detailed-post" } });

		await waitFor(() => {
			expect(screen.queryByText("Post not found")).toBeInTheDocument();
		});

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	test("슬러그가 없을 경우 로딩 상태 유지", async () => {
		render(PostDetail, { params: {} });
		expect(screen.getByText(/Loading post\.\.\./i)).toBeInTheDocument();
	});

	test("복사 버튼 클릭 시 에러 처리", async () => {
		const mockPostWithCode = {
			...mockPost,
			html: `
				<div class="markdown-content">
					<pre>
						<button class="devsite-icon-copy"></button>
						<code>console.log("hello");</code>
					</pre>
				</div>
			`,
		};
		vi.mocked(postLoader.loadPostBySlug).mockResolvedValue(
			mockPostWithCode as any,
		);

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const writeTextMock = vi
			.fn()
			.mockRejectedValue(new Error("Clipboard Error"));
		Object.assign(navigator, {
			clipboard: {
				writeText: writeTextMock,
			},
		});

		render(PostDetail, { params: { slug: "detailed-post" } });

		await waitFor(() => {
			expect(screen.getByText("Detailed Post")).toBeInTheDocument();
		});

		await new Promise((resolve) => setTimeout(resolve, 1000));

		const copyButton = document.querySelector(".devsite-icon-copy");
		if (copyButton) {
			await fireEvent.click(copyButton);
			expect(writeTextMock).toHaveBeenCalled();
			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith(
					expect.stringContaining("클립보드 복사 실패"),
					expect.anything(),
				);
			});
		}
		consoleSpy.mockRestore();
	});

	test("Mermaid 렌더링 에러 처리", async () => {
		const mockPostWithMermaid = {
			...mockPost,
			html: '<div class="markdown-content"><div class="mermaid-diagram" id="mermaid-err" data-mermaid-code="invalid"></div></div>',
		};
		vi.mocked(postLoader.loadPostBySlug).mockResolvedValue(
			mockPostWithMermaid as any,
		);

		const mermaid = (await import("mermaid")).default;
		const renderSpy = vi
			.mocked(mermaid.render)
			.mockRejectedValue(new Error("Mermaid Error") as any);

		render(PostDetail, { params: { slug: "detailed-post" } });

		await waitFor(() => {
			expect(screen.queryByText("Detailed Post")).toBeInTheDocument();
		});

		await waitFor(
			() => {
				const el = document.getElementById("mermaid-err");
				expect(el?.innerHTML).toContain("Mermaid diagram rendering failed");
			},
			{ timeout: 10000 },
		);

		expect(renderSpy).toHaveBeenCalled();
	}, 20000);
});
