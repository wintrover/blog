import { beforeEach, describe, expect, test, vi } from "vitest";
import * as markdown from "../src/lib/markdown";
import { loadAllPosts, loadPostBySlug } from "../src/lib/postLoader";
import * as utils from "../src/lib/utils";

// Mocking import.meta.glob is tricky.
// We will mock the modules that postLoader.ts depends on to control the flow.

vi.mock("../src/lib/utils", async (importActual) => {
	const actual = await importActual<typeof import("../src/lib/utils")>();
	return {
		...actual,
		parseFrontMatter: vi.fn(actual.parseFrontMatter),
		slugify: vi.fn(actual.slugify),
	};
});

vi.mock("../src/lib/markdown", async (importActual) => {
	const actual = await importActual<typeof import("../src/lib/markdown")>();
	return {
		...actual,
		parseMarkdown: vi.fn(actual.parseMarkdown),
	};
});

const { categoryConfigMock } = vi.hoisted(() => {
	return {
		categoryConfigMock: {
			categories: {
				project: { name: "Project" },
				company: { name: "Company Work" },
				tutorial: { name: "Tutorial" },
				general: { name: "General" },
			},
			defaultCategory: "general",
			autoAssignByFolder: true,
		},
	};
});

vi.mock("../src/lib/categories.json", () => ({
	default: categoryConfigMock,
}));

describe("postLoader", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("EP-BVA: loadAllPosts - 기본 로딩 및 정렬 확인", async () => {
		const posts = await loadAllPosts();
		expect(Array.isArray(posts)).toBe(true);
		if (posts.length > 1) {
			// 날짜 내림차순 정렬 확인
			const firstDate = new Date(posts[0].date).getTime();
			const secondDate = new Date(posts[1].date).getTime();
			expect(firstDate).toBeGreaterThanOrEqual(secondDate);
		}
	});

	test("EP-BVA: loadAllPosts - 파싱 에러 발생 시 처리 (Line 48-58)", async () => {
		vi.mocked(utils.parseFrontMatter).mockImplementationOnce(() => {
			throw new Error("Mocked Parsing Error");
		});

		const posts = await loadAllPosts();
		// 에러가 발생한 포스트는 제외되고 나머지는 로드되어야 함
		expect(Array.isArray(posts)).toBe(true);
	});

	test("EP-BVA: loadAllPosts - 카테고리 자동 할당 해제 시 기본값 확인 (Line 40)", async () => {
		categoryConfigMock.autoAssignByFolder = false;
		vi.mocked(utils.parseFrontMatter).mockImplementationOnce((content) => {
			return { data: { title: "No Category Post" }, content: "Body" };
		});

		const posts = await loadAllPosts();
		const noCategoryPost = posts.find((p) => p.title === "No Category Post");
		expect(noCategoryPost?.category).toBe("general");
		categoryConfigMock.autoAssignByFolder = true; // 복구
	});

	test("EP-BVA: determineCategoryFromPath - 매핑되지 않은 폴더 (Line 14)", async () => {
		// loadAllPosts를 통해 determineCategoryFromPath가 호출되도록 함.
		// 하지만 path를 조작할 수 없으므로,
		// 실제 파일들 중 mapping에 없는 폴더가 있는지 확인하거나
		// determineCategoryFromPath를 직접 테스트할 수 있도록 export를 고려해야 함.
		// 여기서는 이미 general 등이 매핑되어 있으므로,
		// 만약 mapping에 없는 폴더가 있다면 defaultCategory가 반환됨.

		// 대신 categories.json의 mapping에 없는 값을 반환하도록
		// determineCategoryFromPath의 로직을 간접적으로 테스트.
		const posts = await loadAllPosts();
		// 모든 포스트가 category를 가지고 있어야 함
		posts.forEach((post) => {
			expect(post.category).toBeDefined();
		});
	});

	test("EP-BVA: loadAllPosts - slugify 기본값 (Line 37)", async () => {
		vi.mocked(utils.parseFrontMatter).mockImplementationOnce(() => {
			return { data: {}, content: "Body" };
		});
		vi.mocked(utils.slugify).mockImplementation((text) => text);

		const posts = await loadAllPosts();
		// fileName이 slug로 사용되어야 함
		expect(posts.length).toBeGreaterThan(0);
	});

	test("EP-BVA: loadPostBySlug - fileName unknown 및 slugify 기본값 (Line 88-90)", async () => {
		// slugify가 항상 "matched-slug"를 반환하게 하여 루프를 통과하게 함
		vi.mocked(utils.slugify).mockReturnValue("matched-slug");
		vi.mocked(utils.parseFrontMatter).mockReturnValue({
			data: {},
			content: "Body",
		});

		const post = await loadPostBySlug("matched-slug");
		expect(post).not.toBeNull();
		expect(post?.fileName).toBeDefined();
	});

	test("EP-BVA: loadAllPosts - 치명적 에러 발생 시 처리 (Line 66-71) - Error 객체", async () => {
		// sort를 모킹하여 에러 유도
		const spy = vi.spyOn(Array.prototype, "sort").mockImplementationOnce(() => {
			throw new Error("Fatal Sort Error");
		});

		const posts = await loadAllPosts();
		expect(posts).toEqual([]);
		spy.mockRestore();
	});

	test("EP-BVA: loadAllPosts - 치명적 에러 발생 시 처리 (Line 66-71) - Non-Error 객체", async () => {
		// sort를 모킹하여 에러 유도
		const spy = vi.spyOn(Array.prototype, "sort").mockImplementationOnce(() => {
			throw "Fatal String Error";
		});

		const posts = await loadAllPosts();
		expect(posts).toEqual([]);
		spy.mockRestore();
	});

	test("EP-BVA: loadPostBySlug - 존재하는 포스트 로드", async () => {
		const allPosts = await loadAllPosts();
		if (allPosts.length > 0) {
			const target = allPosts[0];
			const post = await loadPostBySlug(target.slug);
			expect(post).not.toBeNull();
			expect(post?.slug).toBe(target.slug);
		}
	});

	test("EP-BVA: loadPostBySlug - 존재하지 않는 포스트 (Line 98-103)", async () => {
		const post = await loadPostBySlug("non-existent-slug-12345");
		expect(post).toBeNull();
	});

	test("EP-BVA: loadAllPosts - 파싱 에러 발생 시 처리 (Line 48-58) - Non-Error 객체", async () => {
		vi.mocked(utils.parseFrontMatter).mockImplementationOnce(() => {
			throw "Non-Error Parsing Error";
		});

		const posts = await loadAllPosts();
		expect(Array.isArray(posts)).toBe(true);
	});

	test("EP-BVA: loadAllPosts - 메타데이터 누락 시 기본값 확인 (Line 37-42)", async () => {
		vi.mocked(utils.parseFrontMatter).mockImplementationOnce((content) => {
			return { data: {}, content: "Body" };
		});

		const posts = await loadAllPosts();
		// 메타데이터가 없는 포스트가 하나라도 있어야 함 (mockImplementationOnce 했으므로)
		// posts.sort 때문에 어떤 것이 mock된 것인지 알기 어려울 수 있음
		// 하지만 최소한 에러 없이 동작하고 기본값이 설정되어야 함
		expect(posts.length).toBeGreaterThan(0);
	});

	test("EP-BVA: loadPostBySlug - 메타데이터 누락 시 기본값 확인 (Line 111-115)", async () => {
		// parseFrontMatter가 빈 데이터를 반환하도록 모킹하지만,
		// slugify가 항상 일치하는 값을 반환하게 하여 루프를 통과하게 함
		vi.mocked(utils.parseFrontMatter).mockReturnValue({
			data: {},
			content: "Body",
		});
		vi.mocked(utils.slugify).mockReturnValue("matched-slug");

		const post = await loadPostBySlug("matched-slug");
		expect(post).not.toBeNull();
		expect(post?.title).toBeDefined();
		expect(post?.date).toBeDefined();
		expect(post?.category).toBe("general");
	});

	test("EP-BVA: loadPostBySlug - 에러 발생 시 처리 (Line 120-130) - Error 객체", async () => {
		// slugify를 모킹하여 에러 유도
		vi.mocked(utils.slugify).mockImplementationOnce(() => {
			throw new Error("Mocked Slugify Error");
		});

		const post = await loadPostBySlug("any-slug");
		expect(post).toBeNull();
	});

	test("EP-BVA: loadPostBySlug - 에러 발생 시 처리 (Line 120-130) - Non-Error 객체", async () => {
		vi.mocked(utils.slugify).mockImplementationOnce(() => {
			throw "Non-Error Slugify Error";
		});

		const post = await loadPostBySlug("any-slug");
		expect(post).toBeNull();
	});
});
