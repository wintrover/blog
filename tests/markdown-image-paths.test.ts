import { describe, expect, test } from "vitest";
import { normalizeImageSrc } from "../src/lib/utils";

describe("normalizeImageSrc", () => {
	test("원격 URL 및 data URI는 변경하지 않음 (Equivalence Partitioning: Remote/Data)", () => {
		expect(normalizeImageSrc("https://example.com/image.jpg")).toBe(
			"https://example.com/image.jpg",
		);
		expect(normalizeImageSrc("http://example.com/image.jpg")).toBe(
			"http://example.com/image.jpg",
		);
		const dataUri =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
		expect(normalizeImageSrc(dataUri)).toBe(dataUri);
	});

	test("절대 경로에 BASE_URL 접두 (Equivalence Partitioning: Absolute Path)", () => {
		expect(normalizeImageSrc("/assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		expect(normalizeImageSrc("/images/test.png")).toBe("/blog/images/test.png");
		expect(normalizeImageSrc("/favicon.ico")).toBe("/blog/favicon.ico");
	});

	test("상대 경로에 BASE_URL 접두 (Equivalence Partitioning: Relative Path)", () => {
		expect(normalizeImageSrc("assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		expect(normalizeImageSrc("images/test.png")).toBe("/blog/images/test.png");
		expect(normalizeImageSrc("test.jpg")).toBe("/blog/test.jpg");
	});

	test("이전 하드코딩된 /blog/ 및 BASE_URL 중복 처리", () => {
		expect(normalizeImageSrc("/blog/assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		expect(normalizeImageSrc("/blog/images/test.png")).toBe(
			"/blog/images/test.png",
		);
	});

	test("상대 경로 내 점(.) 및 점점(..) 처리 (EP-BVA: Path Resolution)", () => {
		expect(normalizeImageSrc("../assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		expect(normalizeImageSrc("./assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		expect(normalizeImageSrc("../../assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		// 더 깊은 경로 및 복합 경로
		expect(normalizeImageSrc("a/b/../../images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		expect(normalizeImageSrc("a/./b/../images/test.jpg")).toBe(
			"/blog/a/images/test.jpg",
		);
	});

	test("레거시 assets 경로 플래트닝 (EP-BVA: Legacy Path Handling)", () => {
		// 2자리 숫자 디렉토리
		expect(normalizeImageSrc("assets/images/01/test.jpg")).toBe(
			"/blog/images/01-test.jpg",
		);
		// 일반 디렉토리
		expect(normalizeImageSrc("assets/images/subdir/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		// 하위 디렉토리가 없는 경우
		expect(normalizeImageSrc("assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
	});

	test("EP-BVA: 경계값 및 유효하지 않은 입력 처리", () => {
		expect(normalizeImageSrc("")).toBe("");
		expect(normalizeImageSrc(null as any)).toBe(null);
		expect(normalizeImageSrc(undefined as any)).toBe(undefined);
		expect(normalizeImageSrc(123 as any)).toBe(123);
	});
});
