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

	test("포스트 로드 실패 시 에러 메시지 없이 빈 목록을 보여주어야 함 (no-posts)", async () => {
		vi.mocked(postLoader.loadAllPosts).mockRejectedValue(
			new Error("Fetch error"),
		);
		render(BlogList);

		await waitFor(() => {
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
});
