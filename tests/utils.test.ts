import { describe, expect, test } from "vitest";
import {
	formatDate,
	parseFrontMatter,
	slugify,
	truncateText,
} from "../src/lib/utils";

describe("formatDate", () => {
	test("날짜 포맷팅 확인 (ko-KR)", () => {
		const result = formatDate("2023-10-26");
		expect(result).toMatch(/2023\.\s*10\.\s*26\./);
	});
});

describe("truncateText", () => {
	test("wordLimit 이하인 경우 원본 반환 (EP: Length <= Limit)", () => {
		const text = "Hello world";
		expect(truncateText(text, 5)).toBe(text);
	});

	test("wordLimit 초과하는 경우 절삭 (EP: Length > Limit)", () => {
		const text = "One two three four five";
		const result = truncateText(text, 3);
		expect(result).toBe("One two three...");
	});

	test("HTML 태그 제거 확인 (EP: HTML Content)", () => {
		const text = "<p>Hello <strong>world</strong></p>";
		expect(truncateText(text, 10)).toBe("Hello world");
	});

	test("EP-BVA: 경계값 처리 (wordLimit = 0)", () => {
		const text = "Hello world";
		expect(truncateText(text, 0)).toBe("...");
	});

	test("EP-BVA: 빈 문자열 처리", () => {
		expect(truncateText("", 10)).toBe("");
		expect(truncateText(null as any, 10)).toBe("");
	});
});

describe("slugify", () => {
	test("공백 및 특수문자 처리", () => {
		expect(slugify("Hello World!")).toBe("hello-world");
		expect(slugify("Hello   World")).toBe("hello-world");
		expect(slugify("---Hello---World---")).toBe("hello-world");
	});

	test("EP-BVA: 빈 문자열 처리", () => {
		expect(slugify("")).toBe("");
		expect(slugify(null as any)).toBe("");
	});
});

describe("parseFrontMatter", () => {
	test("정상적인 FrontMatter 파싱 (EP: Valid Content)", () => {
		const md =
			'---\ntitle: "My Title"\ndate: 2023-10-26\ntags: t1, t2\npublished: true\n---\nBody content';
		const { data, content } = parseFrontMatter(md);
		expect(data).toEqual({
			title: "My Title",
			date: "2023-10-26",
			tags: ["t1", "t2"],
			published: true,
		});
		expect(content.trim()).toBe("Body content");
	});

	test("FrontMatter가 없는 경우 (EP: No FrontMatter)", () => {
		const md = "Just content";
		const { data, content } = parseFrontMatter(md);
		expect(data).toEqual({});
		expect(content).toBe(md);
	});

	test("숫자 및 불리언 타입 변환 확인 (EP: Type Conversion)", () => {
		const md = "---\ncount: 123\nactive: false\n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.count).toBe(123);
		expect(data.active).toBe(false);
	});

	test("EP-BVA: 빈 FrontMatter", () => {
		const md = "---\n---\nContent";
		const { data, content } = parseFrontMatter(md);
		expect(data).toEqual({});
		expect(content.trim()).toBe("Content");
	});

	test("싱글 쿼트 문자열 처리 확인 (EP: Single Quote)", () => {
		const md = "---\ntitle: 'Single Quote'\n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.title).toBe("Single Quote");
	});

	test("태그 구분자(쉼표, 공백) 및 빈 태그 처리 (EP: Tags Split)", () => {
		const md = "---\ntags: t1,  t2 t3,,t4\n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.tags).toEqual(["t1", "t2", "t3", "t4"]);
	});

	test("EP-BVA: 빈 값 필터링 확인", () => {
		const md = "---\nkey: \ntags: , , , \n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.key).toBe("");
		expect(data.tags).toEqual([]);
	});

	test("EP-BVA: 복합 구분자 태그 처리", () => {
		const md = "---\ntags: t1,,,t2   t3\n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.tags).toEqual(["t1", "t2", "t3"]);
	});

	test("EP-BVA: 따옴표가 짝이 맞지 않는 경우", () => {
		const md =
			"---\nt1: \"double\nt2: 'single\nt3: double\"\nt4: single'\n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.t1).toBe('"double');
		expect(data.t2).toBe("'single");
		expect(data.t3).toBe('double"');
		expect(data.t4).toBe("single'");
	});

	test("EP-BVA: 다중 구분자 및 공백 처리", () => {
		const md = "---\ntags: ,tag1, ,tag2, \n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.tags).toEqual(["tag1", "tag2"]);
	});
});
