import { describe, expect, test } from "vitest";
import { absolutizeSrc } from "../scripts/post-to-dev";

describe("absolutizeSrc", () => {
	const base = "https://wintrover.github.io/blog";

	test("원격 URL 및 data URI는 유지", () => {
		expect(absolutizeSrc("https://example.com/x.png", base)).toBe(
			"https://example.com/x.png",
		);
		const dataUri =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
		expect(absolutizeSrc(dataUri, base)).toBe(dataUri);
	});

	test("절대 경로 처리 (/assets/images/)", () => {
		expect(absolutizeSrc("/assets/images/a.png", base)).toBe(
			"https://wintrover.github.io/blog/images/a.png",
		);
		expect(absolutizeSrc("/blog/assets/images/a.png", base)).toBe(
			"https://wintrover.github.io/blog/images/a.png",
		);
	});

	test("상대 경로 처리 (assets/images/)", () => {
		expect(absolutizeSrc("assets/images/a.png", base)).toBe(
			"https://wintrover.github.io/blog/images/a.png",
		);
	});

	test("베이스 URL 끝에 슬래시가 있는 경우 처리", () => {
		const baseWithSlash = "https://wintrover.github.io/blog/";
		expect(absolutizeSrc("/assets/images/a.png", baseWithSlash)).toBe(
			"https://wintrover.github.io/blog/images/a.png",
		);
		expect(absolutizeSrc("assets/images/a.png", baseWithSlash)).toBe(
			"https://wintrover.github.io/blog/images/a.png",
		);
	});

	test("EP-BVA: 빈 값 및 유효하지 않은 타입 처리", () => {
		expect(absolutizeSrc("", base)).toBe("");
		expect(absolutizeSrc(null as any, base)).toBe(null);
		expect(absolutizeSrc(undefined as any, base)).toBe(undefined);
	});

	test("EP-BVA: 레거시 2자리 숫자 디렉토리 처리", () => {
		expect(absolutizeSrc("assets/images/09/test.png", base)).toBe(
			"https://wintrover.github.io/blog/images/09-test.png",
		);
	});

	test("EP-BVA: 레거시 일반 디렉토리 처리", () => {
		expect(absolutizeSrc("assets/images/subdir/test.png", base)).toBe(
			"https://wintrover.github.io/blog/images/test.png",
		);
	});

	test("EP-BVA: 복합 경로 처리 (.. 및 .)", () => {
		expect(absolutizeSrc("../assets/images/a.png", base)).toBe(
			"https://wintrover.github.io/blog/images/a.png",
		);
		expect(absolutizeSrc("./images/a.png", base)).toBe(
			"https://wintrover.github.io/blog/images/a.png",
		);
	});
});
