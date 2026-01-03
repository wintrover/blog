import { render, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Comments from "../src/components/Comments.svelte";

// giscusConfig 모킹
vi.mock("../src/lib/giscus-config", () => ({
	giscusConfig: {
		repo: "default/repo",
		repoId: "default-repo-id",
		category: "General",
		categoryId: "default-category-id",
		mapping: "pathname",
		strict: "0",
		reactionsEnabled: "1",
		emitMetadata: "0",
		inputPosition: "bottom",
		theme: "light",
		lang: "ko",
		debug: true,
	},
}));

describe("Comments Component", () => {
	beforeEach(() => {
		document.head.innerHTML = "";
		document.body.innerHTML = "";
		vi.clearAllMocks();
	});

	test("기본 렌더링 확인", () => {
		const { container } = render(Comments);
		const wrapper = container.querySelector(".giscus-wrapper");
		expect(wrapper).toBeInTheDocument();
	});

	test("필수 설정 누락 시 에러 로깅", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(Comments, {
			repo: "", // repo 누락
		});

		// onMount가 비동기로 loadGiscus를 호출하므로 대기 필요
		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("Missing required Giscus configuration"),
				expect.any(Object),
			);
		});

		consoleSpy.mockRestore();
	});

	test("Giscus 스크립트 삽입 확인", async () => {
		render(Comments, {
			repo: "test/repo",
			repoId: "test-repo-id",
			categoryId: "test-category-id",
		});

		await waitFor(
			() => {
				const script = document.querySelector(
					'script[src="https://giscus.app/client.js"]',
				);
				expect(script).toBeInTheDocument();
				expect(script).toHaveAttribute("data-repo", "test/repo");
				expect(script).toHaveAttribute("data-repo-id", "test-repo-id");
			},
			{ timeout: 5000 },
		);
	});

	test("Giscus 메시지 이벤트 핸들링", async () => {
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		render(Comments, {
			repo: "test/repo",
			repoId: "test-repo-id",
			categoryId: "test-category-id",
		});

		// 스크립트가 로드된 후 메시지 이벤트 발생 시뮬레이션
		await waitFor(() => {
			expect(
				document.querySelector('script[src="https://giscus.app/client.js"]'),
			).toBeInTheDocument();
		});

		// Giscus로부터의 메시지 시뮬레이션
		const messageEvent = new MessageEvent("message", {
			data: { giscus: { discussion: { id: "123" } } },
			origin: "https://giscus.app",
		});
		window.dispatchEvent(messageEvent);

		// debug가 true인 경우 로그 출력 확인
		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith("💬 Giscus Message:", {
				discussion: { id: "123" },
			});
		});

		// 에러 메시지 시뮬레이션
		const errorMessageEvent = new MessageEvent("message", {
			data: { giscus: { error: "Some Error" } },
			origin: "https://giscus.app",
		});
		window.dispatchEvent(errorMessageEvent);
		await waitFor(() => {
			expect(errorSpy).toHaveBeenCalledWith("❌ Giscus Error:", "Some Error");
		});

		consoleSpy.mockRestore();
		errorSpy.mockRestore();
	});

	test("테마 업데이트 확인", async () => {
		const { component } = render(Comments, {
			repo: "test/repo",
			repoId: "test-repo-id",
			categoryId: "test-category-id",
		});

		await waitFor(() => {
			expect(document.querySelector(".giscus-wrapper")).toBeInTheDocument();
		});

		// iframe 생성 시뮬레이션
		const wrapper = document.querySelector(".giscus-wrapper");
		const iframe = document.createElement("iframe");
		iframe.className = "giscus-frame";
		const postMessageSpy = vi.fn();

		Object.defineProperty(iframe, "contentWindow", {
			value: { postMessage: postMessageSpy },
			configurable: true,
		});

		wrapper?.appendChild(iframe);

		// 테마 업데이트 호출
		(component as any).updateTheme("dark");

		expect(postMessageSpy).toHaveBeenCalledWith(
			{
				giscus: {
					setConfig: {
						theme: "dark",
					},
				},
			},
			"https://giscus.app",
		);
	});

	test("Giscus 스크립트 로드 에러 처리", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		render(Comments, {
			repo: "test/repo",
			repoId: "test-repo-id",
			categoryId: "test-category-id",
		});

		await waitFor(() => {
			const script = document.querySelector(
				'script[src="https://giscus.app/client.js"]',
			);
			expect(script).toBeInTheDocument();
			const errorEvent = new Event("error");
			script?.dispatchEvent(errorEvent);
		});

		await waitFor(() => {
			expect(errorSpy).toHaveBeenCalledWith("❌ Failed to load Giscus script");
		});

		errorSpy.mockRestore();
	});

	test("컴포넌트 언마운트 시 클린업 확인", async () => {
		const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
		const { unmount } = render(Comments, {
			repo: "test/repo",
			repoId: "test-repo-id",
			categoryId: "test-category-id",
		});

		unmount();

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"message",
			expect.any(Function),
		);
		removeEventListenerSpy.mockRestore();
	});

	test("mapping이 specific인 경우 term 설정 확인", async () => {
		render(Comments, {
			repo: "test/repo",
			repoId: "test-repo-id",
			categoryId: "test-category-id",
			mapping: "specific",
			term: "custom-term",
		});

		await waitFor(() => {
			const script = document.querySelector(
				'script[src="https://giscus.app/client.js"]',
			);
			expect(script).toHaveAttribute("data-mapping", "specific");
			expect(script).toHaveAttribute("data-term", "custom-term");
		});
	});

	test("iframe이 giscus-frame 클래스가 없을 때도 테마 업데이트 시도", async () => {
		const { component } = render(Comments, {
			repo: "test/repo",
			repoId: "test-repo-id",
			categoryId: "test-category-id",
		});

		await waitFor(() => {
			expect(document.querySelector(".giscus-wrapper")).toBeInTheDocument();
		});

		// 일반 iframe 생성 (클래스 없음)
		const wrapper = document.querySelector(".giscus-wrapper");
		const iframe = document.createElement("iframe");
		const postMessageSpy = vi.fn();
		Object.defineProperty(iframe, "contentWindow", {
			value: { postMessage: postMessageSpy },
			configurable: true,
		});
		wrapper?.appendChild(iframe);

		// 테마 업데이트 호출
		(component as any).updateTheme("dark");

		expect(postMessageSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				giscus: { setConfig: { theme: "dark" } },
			}),
			"https://giscus.app",
		);
	});
});
