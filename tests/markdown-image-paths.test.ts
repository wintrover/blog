import { normalizeImageSrc } from "../src/lib/markdown";

describe("normalizeImageSrc", () => {
	test("원격 URL은 변경하지 않음", () => {
		expect(normalizeImageSrc("https://example.com/image.jpg")).toBe(
			"https://example.com/image.jpg",
		);
		expect(normalizeImageSrc("http://example.com/image.jpg")).toBe(
			"http://example.com/image.jpg",
		);
	});

	test("data URI는 변경하지 않음", () => {
		const dataUri =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
		expect(normalizeImageSrc(dataUri)).toBe(dataUri);
	});

	test("절대 경로에 BASE_URL 접두", () => {
		expect(normalizeImageSrc("/assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		expect(normalizeImageSrc("/images/test.png")).toBe("/blog/images/test.png");
		expect(normalizeImageSrc("/favicon.ico")).toBe("/blog/favicon.ico");
	});

	test("상대 경로에 BASE_URL 접두", () => {
		expect(normalizeImageSrc("assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		expect(normalizeImageSrc("images/test.png")).toBe("/blog/images/test.png");
		expect(normalizeImageSrc("test.jpg")).toBe("/blog/test.jpg");
	});

	test("이전 하드코딩된 /blog/ 경로 처리", () => {
		expect(normalizeImageSrc("/blog/assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		expect(normalizeImageSrc("/blog/images/test.png")).toBe(
			"/blog/images/test.png",
		);
	});

	test("이미 BASE_URL로 시작하는 경로는 그대로 유지", () => {
		expect(normalizeImageSrc("/blog/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
	});

	test("상대 경로 내 assets 포함 처리", () => {
		expect(normalizeImageSrc("../assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		expect(normalizeImageSrc("./assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
		expect(normalizeImageSrc("../../assets/images/test.jpg")).toBe(
			"/blog/images/test.jpg",
		);
	});

	test("빈 값이나 잘못된 타입 처리", () => {
		expect(normalizeImageSrc("")).toBe("");
		expect(normalizeImageSrc(null as any)).toBe(null);
		expect(normalizeImageSrc(undefined as any)).toBe(undefined);
		expect(normalizeImageSrc(123 as any)).toBe(123);
	});
});
