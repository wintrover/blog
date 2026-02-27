import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { get } from "svelte/store";
import { push } from "svelte-spa-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import BlogList from "../src/components/BlogList.svelte";
import * as postLoader from "../src/lib/postLoader";
import { selectedCategory } from "../src/stores/category";

// Mock postLoader
vi.mock("../src/lib/postLoader", () => ({
	loadAllPosts: vi.fn(),
}));

// Mock svelte-spa-router
vi.mock("svelte-spa-router", () => ({
	push: vi.fn(),
}));

describe("BlogList Component", () => {
	const mockPosts = [
		{
			title: "Post 1",
			slug: "post-1",
			category: "Tech",
			date: "2023-10-01",
			excerpt: "Excerpt 1",
		},
		{
			title: "Post 2",
			slug: "post-2",
			category: "Life",
			date: "2023-10-02",
			excerpt: "Excerpt 2",
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(postLoader.loadAllPosts).mockResolvedValue(mockPosts);
	});

	test("전체 포스트 목록을 렌더링해야 함", async () => {
		render(BlogList);

		await waitFor(() => {
			expect(screen.getByText("Post 1")).toBeInTheDocument();
			expect(screen.getByText("Post 2")).toBeInTheDocument();
		});

		expect(screen.getByText("Excerpt 1")).toBeInTheDocument();
		expect(screen.getByText("Excerpt 2")).toBeInTheDocument();
		expect(get(selectedCategory)).toBe("all");
	});

	test("카테고리 파라미터가 있을 때 필터링된 포스트를 렌더링해야 함", async () => {
		render(BlogList, { params: { category: "tech" } });

		await waitFor(() => {
			expect(screen.getByText("Post 1")).toBeInTheDocument();
		});

		expect(screen.queryByText("Post 2")).not.toBeInTheDocument();
		expect(get(selectedCategory)).toBe("Tech");
	});

	test("포스트 클릭 시 상세 페이지로 이동해야 함", async () => {
		render(BlogList);

		await waitFor(() => {
			expect(screen.getByText("Post 1")).toBeInTheDocument();
		});

		const postLink = screen.getByText("Post 1");
		await fireEvent.click(postLink);

		expect(push).toHaveBeenCalledWith("/post/post-1");
	});

	test("에러 발생 시 에러 로그를 출력하고 목록을 비워야 함", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const error = new Error("Fetch error");
		vi.mocked(postLoader.loadAllPosts).mockRejectedValue(error);

		render(BlogList);

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("❌ [BlogList] 포스트 목록 로딩 중 에러 발생:"),
				expect.any(Object),
			);
			expect(
				screen.getByText("No posts found in this category."),
			).toBeInTheDocument();
		});
	});

	test("카테고리 필터링이 올바르게 작동해야 함", async () => {
		const mockPosts = [
			{
				slug: "post-1",
				title: "Post 1",
				category: "Tech",
				date: "2023-01-01",
				summary: "Summary 1",
			},
			{
				slug: "post-2",
				title: "Post 2",
				category: "Life",
				date: "2023-01-02",
				summary: "Summary 2",
			},
		];
		vi.mocked(postLoader.loadAllPosts).mockResolvedValue(mockPosts as any);

		const { rerender } = render(BlogList, { params: {} });
		await waitFor(() => {
			expect(screen.getByText("Post 1")).toBeInTheDocument();
			expect(screen.getByText("Post 2")).toBeInTheDocument();
		});

		await rerender({ params: { category: "tech" } });
		await waitFor(() => {
			expect(screen.getByText("Post 1")).toBeInTheDocument();
			expect(screen.queryByText("Post 2")).not.toBeInTheDocument();
		});

		// Life category
		await rerender({ params: { category: "life" } });
		await waitFor(() => {
			expect(screen.queryByText("Post 1")).not.toBeInTheDocument();
			expect(screen.getByText("Post 2")).toBeInTheDocument();
		});
	});

	test("포스트 데이터가 없을 때 빈 목록 표시", async () => {
		vi.mocked(postLoader.loadAllPosts).mockResolvedValue([]);
		render(BlogList);
		await waitFor(() => {
			expect(
				screen.getByText("No posts found in this category."),
			).toBeInTheDocument();
		});
	});

	test("문자열 에러 발생 시에도 올바르게 처리해야 함", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		vi.mocked(postLoader.loadAllPosts).mockRejectedValue("String error");

		render(BlogList);

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("❌ [BlogList] 포스트 목록 로딩 중 에러 발생:"),
				expect.objectContaining({ message: "String error" }),
			);
			expect(
				screen.getByText("No posts found in this category."),
			).toBeInTheDocument();
		});
	});

	test("존재하지 않는 카테고리일 경우 빈 목록을 보여주어야 함", async () => {
		render(BlogList, { params: { category: "unknown" } });

		await waitFor(() => {
			expect(
				screen.getByText("No posts found in this category."),
			).toBeInTheDocument();
		});
		expect(get(selectedCategory)).toBe("all");
	});

	test("카테고리는 있지만 매칭되는 포스트가 없을 때 selectedCategory는 'all'이 되어야 함", async () => {
		// mockPosts에 없는 카테고리
		render(BlogList, { params: { category: "empty" } });

		await waitFor(() => {
			expect(get(selectedCategory)).toBe("all");
		});
	});

	test("포스트에 카테고리나 요약이 없을 때도 정상 렌더링되어야 함", async () => {
		vi.mocked(postLoader.loadAllPosts).mockResolvedValue([
			{
				title: "No Meta Post",
				slug: "no-meta",
				date: "2023-10-01",
				// category, excerpt 누락
			},
		]);

		render(BlogList);

		await waitFor(() => {
			expect(screen.getByText("No Meta Post")).toBeInTheDocument();
		});

		// 카테고리 배지나 요약이 없어야 함
		expect(screen.queryByText("Excerpt")).not.toBeInTheDocument();
	});
});
