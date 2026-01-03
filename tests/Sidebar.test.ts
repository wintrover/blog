import { fireEvent, render, screen } from "@testing-library/svelte";
import { get } from "svelte/store";
import { push } from "svelte-spa-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Sidebar from "../src/components/Sidebar.svelte";
import { selectedCategory } from "../src/stores/category";
import { posts } from "../src/stores/posts";

// Mock svelte-spa-router
vi.mock("svelte-spa-router", () => ({
	push: vi.fn(),
}));

describe("Sidebar Component", () => {
	const mockPosts = [
		{ title: "Post 1", category: "Project", tags: ["Svelte"] },
		{ title: "Post 2", category: "Company Work", tags: ["Vitest"] },
		{ title: "Post 3", category: "Project", tags: ["Svelte"] },
	];

	beforeEach(() => {
		(posts as any).set(mockPosts);
		(selectedCategory as any).set("all");
		vi.clearAllMocks();
	});

	test("카테고리 목록이 올바르게 표시되어야 함", () => {
		render(Sidebar);

		expect(screen.getByText(/All Posts \(3\)/)).toBeInTheDocument();
		expect(screen.getByText(/Project \(2\)/)).toBeInTheDocument();
		expect(screen.getByText(/Company Work \(1\)/)).toBeInTheDocument();
	});

	test("카테고리 클릭 시 selectedCategory가 업데이트되고 경로가 이동해야 함", async () => {
		render(Sidebar);

		const projectButton = screen.getByText(/Project \(2\)/);
		await fireEvent.click(projectButton);

		expect(get(selectedCategory)).toBe("Project");
		expect(push).toHaveBeenCalledWith("/category/project");
	});

	test("All Posts 클릭 시 'all'로 설정되고 홈으로 이동해야 함", async () => {
		(selectedCategory as any).set("Project");
		render(Sidebar);

		const allPostsButton = screen.getByText(/All Posts \(3\)/);
		await fireEvent.click(allPostsButton);

		expect(get(selectedCategory)).toBe("all");
		expect(push).toHaveBeenCalledWith("/");
	});

	test("아바타 클릭 시 홈으로 이동하고 'all'로 설정되어야 함", async () => {
		render(Sidebar);

		const avatar = screen.getByAltText(/wintrover/i); // 대소문자 무시
		await fireEvent.click(avatar);

		expect(get(selectedCategory)).toBe("all");
		expect(push).toHaveBeenCalledWith("/");
	});
});
