import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, expect, test, vi } from "vitest";
import * as postLoader from "../src/lib/postLoader";
import { posts } from "../src/stores/posts";

// Mock the posts store
vi.mock("../src/stores/posts", async () => {
	const { writable } = await import("svelte/store");
	return {
		posts: writable([]),
	};
});

// Mock the post loader
vi.mock("../src/lib/postLoader", () => ({
	loadAllPosts: vi.fn().mockResolvedValue([]),
	loadPostBySlug: vi.fn().mockResolvedValue(null),
}));

// Mock mermaid to avoid errors in PostDetail
vi.mock("mermaid", () => ({
	default: {
		initialize: vi.fn(),
		run: vi.fn(),
		render: vi.fn().mockResolvedValue({ svg: "" }),
	},
}));

// Import App after mocks
import App from "../src/App.svelte";

beforeEach(() => {
	document.body.className = "";
	vi.mocked(posts).set([]);
	vi.clearAllMocks();

	// Mock getBoundingClientRect
	window.HTMLElement.prototype.getBoundingClientRect = vi.fn(function (
		this: HTMLElement,
	) {
		if (this.id === "sidebar") {
			return {
				width: 240,
				height: 1000,
				top: 0,
				left: 0,
				right: 240,
				bottom: 1000,
			} as DOMRect;
		}
		if (this.id === "content") {
			return {
				width: 800,
				height: 1000,
				top: 0,
				left: 260, // Not overlapping
				right: 1060,
				bottom: 1000,
			} as DOMRect;
		}
		return {
			width: 1000,
			height: 1000,
			top: 0,
			left: 0,
			right: 1000,
			bottom: 1000,
		} as DOMRect;
	});
});

test("App 구조가 올바르게 렌더링되어야 함", async () => {
	render(App);
	// Using roles instead of text to be more robust
	expect(screen.getByRole("complementary")).toBeInTheDocument(); // aside
	expect(screen.getByRole("main")).toBeInTheDocument();
	expect(screen.getByRole("contentinfo")).toBeInTheDocument(); // footer
});

test("모바일 환경에서 사이드바 초기 상태 확인", async () => {
	Object.defineProperty(window, "innerWidth", {
		writable: true,
		configurable: true,
		value: 500,
	});

	// For mobile, make content overlap or just rely on innerWidth < 768 check
	window.HTMLElement.prototype.getBoundingClientRect = vi.fn(function (
		this: HTMLElement,
	) {
		if (this.id === "sidebar")
			return { width: 240, right: 240, left: 0 } as DOMRect;
		if (this.id === "content")
			return { width: 300, left: 100, right: 400 } as DOMRect; // Overlapping
		return { width: 500 } as DOMRect;
	});

	render(App);

	// Need to trigger a resize or wait for onMount's checkWithRetry
	window.dispatchEvent(new Event("resize"));

	await waitFor(
		() => {
			expect(document.body.classList.contains("sidebar-collapsed")).toBe(true);
		},
		{ timeout: 3000 },
	);
});

test("넓은 화면에서 사이드바가 겹칠 때 자동으로 접히는지 확인", async () => {
	Object.defineProperty(window, "innerWidth", {
		writable: true,
		configurable: true,
		value: 1000,
	});

	// Mock overlapping
	window.HTMLElement.prototype.getBoundingClientRect = vi.fn(function (
		this: HTMLElement,
	) {
		if (this.id === "sidebar")
			return { width: 240, right: 240, left: 0 } as DOMRect;
		if (this.id === "content")
			return { width: 800, left: 200, right: 1000 } as DOMRect; // Overlapping (240 > 200)
		return { width: 1000 } as DOMRect;
	});

	render(App);
	window.dispatchEvent(new Event("resize"));

	await waitFor(
		() => {
			expect(document.body.classList.contains("sidebar-collapsed")).toBe(true);
		},
		{ timeout: 3000 },
	);
});

test("수동 토글 버튼 작동 확인", async () => {
	render(App);
	const toggleButton = screen.getByLabelText("Toggle Sidebar");

	// Initial state (not collapsed)
	expect(document.body.classList.contains("sidebar-collapsed")).toBe(false);

	await fireEvent.click(toggleButton);
	expect(document.body.classList.contains("sidebar-collapsed")).toBe(true);

	await fireEvent.click(toggleButton);
	expect(document.body.classList.contains("sidebar-collapsed")).toBe(false);
});

test("toggle-sidebar 커스텀 이벤트 작동 확인", async () => {
	render(App);

	// Initial state
	expect(document.body.classList.contains("sidebar-collapsed")).toBe(false);

	document.dispatchEvent(new CustomEvent("toggle-sidebar"));

	await waitFor(() => {
		expect(document.body.classList.contains("sidebar-collapsed")).toBe(true);
	});
});

test("포스트 로딩 에러 시 에러 메시지 표시 확인", async () => {
	const error = new Error("Failed to load posts");
	const errorPromise = Promise.reject(error);
	errorPromise.catch(() => {});

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
