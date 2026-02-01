import { render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, expect, test, vi } from "vitest";
import App from "../src/App.svelte";
import { posts } from "../src/stores/posts";

// Mock the posts store
vi.mock("../src/stores/posts", async () => {
	const { writable } = await import("svelte/store");
	return {
		posts: writable([]),
	};
});

beforeEach(() => {
	document.body.className = "";
	vi.mocked(posts).set([]);
	vi.clearAllMocks();
});

test("App 구조가 올바르게 렌더링되어야 함", () => {
	render(App);
	expect(screen.getByRole("banner")).toBeInTheDocument();
	expect(screen.getByRole("complementary")).toBeInTheDocument();
	expect(screen.getByRole("main")).toBeInTheDocument();
	expect(screen.getByRole("contentinfo")).toBeInTheDocument();
});

test("모바일 환경에서 사이드바 초기 상태 확인", async () => {
	// Set mobile width
	Object.defineProperty(window, "innerWidth", {
		writable: true,
		configurable: true,
		value: 500,
	});

	render(App);

	// Initial render might not have the class yet if it depends on reactive statement
	await waitFor(
		() => {
			expect(document.body.classList.contains("sidebar-collapsed")).toBe(true);
		},
		{ timeout: 2000 },
	);
});

test("포스트 로딩 에러 시 에러 메시지 표시 확인", async () => {
	// To hit the catch block in App.svelte, $posts must be a rejected promise
	// Since App.svelte does {#await $posts}, we can set $posts to a rejected promise
	const error = new Error("Failed to load posts");
	const errorPromise = Promise.reject(error);
	errorPromise.catch(() => {}); // Avoid unhandled rejection

	vi.mocked(posts).set(errorPromise as any);

	render(App);

	await waitFor(
		() => {
			expect(
				screen.getByText(/Error loading posts: Failed to load posts/i),
			).toBeInTheDocument();
		},
		{ timeout: 2000 },
	);
});
