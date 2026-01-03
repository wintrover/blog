import { describe, expect, test } from "vitest";
import {
	formatDate,
	normalizeImageSrc,
	parseFrontMatter,
	slugify,
	truncateText,
} from "../src/lib/utils";

// TODO: Add tests for .svelte components

// Coverage configuration (added for reference)
// coverage: {
//   provider: "v8",
//   include: ["src/**/*.ts", "scripts/**/*.ts", "src/**/*.svelte"],
//   exclude: ["src/posts/**/*.md", "src/templates/**/*.md"],
//   reporter: ["text", "json", "html"],
//   all: true,
// }

// vitest configuration (reference)
// test: {
//   globals: true,
//   environment: "node",
//   include: ["tests/**/*.test.ts"],
//   coverage: {
//     provider: "v8",
//     include: ["src/**/*.ts", "scripts/**/*.ts", "src/**/*.svelte"],
//     exclude: ["src/posts/**/*.md", "src/templates/**/*.md"],
//     reporter: ["text", "json", "html"],
//     all: true,
//   },
//   env: {
//     BASE_URL: "/blog/",
//   },
// }

describe("normalizeImageSrc", () => {
	test("비문자열 입력 처리 (EP: Non-string)", () => {
		expect(normalizeImageSrc(null)).toBe(null);
		expect(normalizeImageSrc(undefined)).toBe(undefined);
		expect(normalizeImageSrc(123)).toBe(123);
	});

	test("Line 46 coverage: p is not empty after BASE removal", () => {
		// p starts with BASE, then we slice it. The remaining p goes to resolveRelativePath.
		expect(normalizeImageSrc("/blog/test.png")).toBe("/blog/test.png");
	});

	test("절대 URL 유지 (EP: Absolute URL)", () => {
		expect(normalizeImageSrc("http://example.com/a.png")).toBe(
			"http://example.com/a.png",
		);
		expect(normalizeImageSrc("https://example.com/a.png")).toBe(
			"https://example.com/a.png",
		);
		expect(normalizeImageSrc("data:image/png;base64,123")).toBe(
			"data:image/png;base64,123",
		);
		// Mutation test: URL containing but not starting with absolute prefix
		expect(normalizeImageSrc("prefix-https://example.com")).not.toBe(
			"prefix-https://example.com",
		);
	});

	test("BASE 경로 제거 및 재부착 (EP: With BASE Prefix)", () => {
		expect(normalizeImageSrc("/blog/images/test.png")).toBe(
			"/blog/images/test.png",
		);
	});

	test("루트 경로 처리 (EP: Root-relative)", () => {
		expect(normalizeImageSrc("/images/test.png")).toBe("/blog/images/test.png");
	});

	test("상대 경로 및 경로 정규화 (EP: Path Traversal)", () => {
		expect(normalizeImageSrc("./images/test.png")).toBe(
			"/blog/images/test.png",
		);
		expect(normalizeImageSrc("../images/test.png")).toBe(
			"/blog/images/test.png",
		);
		expect(normalizeImageSrc("a/../b/c.png")).toBe("/blog/b/c.png");
		// Line 14 coverage: 빈 파트 및 현재 디렉토리 기호 처리
		expect(normalizeImageSrc("/a//b/./c.png")).toBe("/blog/a/b/c.png");
	});

	test("Legacy Assets 경로 변환 (EP: Legacy Assets)", () => {
		expect(normalizeImageSrc("assets/images/01/arch.svg")).toBe(
			"/blog/images/01-arch.svg",
		);
		expect(normalizeImageSrc("assets/images/other/test.png")).toBe(
			"/blog/images/test.png",
		);
		expect(normalizeImageSrc("assets/images/simple.png")).toBe(
			"/blog/images/simple.png",
		);
	});

	test("EP-BVA: 경계값 처리", () => {
		expect(normalizeImageSrc("")).toBe("");
		expect(normalizeImageSrc("/")).toBe("/blog/");
	});

	test("EP-BVA: resolveRelativePath root branch (Line 18 false)", () => {
		// p starts with / (after BASE removal) but normalize removes it if p starts with BASE or /
		// p.startsWith("/") is true in normalizeImageSrc line 42
		// p = p.slice(1) -> "a/b"
		// resolveRelativePath("a/b") -> result "a/b"
		// p.startsWith("/") in resolveRelativePath is false because p was modified in normalizeImageSrc
		expect(normalizeImageSrc("a/b/c.png")).toBe("/blog/a/b/c.png");
	});
});

describe("formatDate", () => {
	test("날짜 포맷팅 확인 (ko-KR)", () => {
		const result = formatDate("2023-10-26");
		expect(result).toMatch(/2023\.\s*10\.\s*26\./);
	});

	test("EP-BVA: 유효하지 않은 날짜 처리", () => {
		const result = formatDate("invalid-date");
		expect(result).toBe("Invalid Date");
	});
});

describe("truncateText", () => {
	test("wordLimit 이하인 경우 원본 반환 (EP: Length <= Limit)", () => {
		const text = "  Hello world  ";
		expect(truncateText(text, 5)).toBe("Hello world");
	});

	test("wordLimit 초과하는 경우 절삭 (EP: Length > Limit)", () => {
		const text = "One two three four five";
		const result = truncateText(text, 3);
		expect(result).toBe("One two three...");
	});

	test("wordLimit와 단어 수가 같은 경우 (BVA: Length == Limit)", () => {
		const text = "One two three";
		expect(truncateText(text, 3)).toBe("One two three");
	});

	test("공백만 있는 경우 처리 (Line 67)", () => {
		expect(truncateText("   ", 5)).toBe("");
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

	test("EP-BVA: 기본 wordLimit 사용", () => {
		const text = "word ".repeat(31).trim();
		const result = truncateText(text);
		expect(result.split(" ").length).toBe(30);
		expect(result.endsWith("...")).toBe(true);
	});
});

describe("slugify", () => {
	test("공백 및 특수문자 처리", () => {
		expect(slugify("Hello World!")).toBe("hello-world");
		expect(slugify("Hello   World")).toBe("hello-world");
		expect(slugify("---Hello---World---")).toBe("hello-world");
		expect(slugify("   multiple   spaces   ")).toBe("multiple-spaces");
		expect(slugify("---multiple---hyphens---")).toBe("multiple-hyphens");
		// Mutation test: Multiple leading/trailing hyphens
		expect(slugify("---hello---")).toBe("hello");
		expect(slugify("hello---")).toBe("hello");
		expect(slugify("---hello")).toBe("hello");
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

	test("EP-BVA: 주석 처리 확인 (Line 93)", () => {
		const md = "---\ntitle: test\n# comment\nkey: value\n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.title).toBe("test");
		expect(data.key).toBe("value");
		expect(Object.keys(data)).not.toContain("# comment");
	});

	test("EP-BVA: FrontMatter split with trailing spaces", () => {
		const md = "---  \ntitle: test\n---  \ncontent";
		const { data, content } = parseFrontMatter(md);
		expect(data.title).toBe("test");
		expect(content.trim()).toBe("content");
	});

	test("EP-BVA: FrontMatter split boundary cases", () => {
		// Should not split if --- is not at the start of the line
		const md1 = "  ---\ntitle: test\n---\ncontent";
		const res1 = parseFrontMatter(md1);
		expect(res1.data).toEqual({});

		// Should not split if there are non-space characters after ---
		const md2 = "---\ntitle: test\n---error\ncontent";
		const res2 = parseFrontMatter(md2);
		expect(res2.data).toEqual({});
	});

	test("EP-BVA: Body with triple dashes join check", () => {
		const md = "---\ntitle: test\n---\npart1\n---\npart2";
		const { content } = parseFrontMatter(md);
		expect(content).toContain("part1\n---\npart2");
	});

	test("EP-BVA: FrontMatter with extra spaces in lines", () => {
		const md = "---\n  key  :   value  \n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.key).toBe("value");
	});

	test("EP-BVA: FrontMatter comment and empty line handling", () => {
		const md =
			"---\ntitle: test\n\n# comment\n  # not a comment : value\n---\n";
		const { data } = parseFrontMatter(md);
		// With trimming, "  # not a comment : value" becomes "# not a comment : value" which starts with #, so it's skipped.
		expect(Object.keys(data)).toEqual(["title"]);
		expect(data.title).toBe("test");
	});

	test("EP-BVA: FrontMatter line ending with hash", () => {
		const md = "---\nkey: value#\n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.key).toBe("value#");
	});

	test("EP-BVA: FrontMatter with multiple separators in tags", () => {
		const md = "---\ntags: t1,, t2  , , t3\n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.tags).toEqual(["t1", "t2", "t3"]);
	});

	test("EP-BVA: 루트 시작 경로 정규화 (Line 18)", () => {
		// normalizeImageSrc internally calls resolveRelativePath
		// We want to hit 'p.startsWith("/") ? `/${result}` : result'
		expect(normalizeImageSrc("/a/b/c.png")).toBe("/blog/a/b/c.png");
	});

	test("EP-BVA: normalizeImageSrc else if branch (Line 42)", () => {
		// If p.startsWith("/") is true, it goes into line 43
		expect(normalizeImageSrc("/images/test.png")).toBe("/blog/images/test.png");
	});

	test("EP-BVA: resolveRelativePath non-root branch (Line 18)", () => {
		// If path doesn't start with "/", it should return result without leading "/"
		// We need to trigger this through normalizeImageSrc
		expect(normalizeImageSrc("a/b/c.png")).toBe("/blog/a/b/c.png");
	});

	test("EP-BVA: flattenLegacyAssetsPath with digit (Line 27)", () => {
		expect(normalizeImageSrc("assets/images/10/test.png")).toBe(
			"/blog/images/10-test.png",
		);
	});

	test("EP-BVA: flattenLegacyAssetsPath without digit (Line 30)", () => {
		expect(normalizeImageSrc("assets/images/abc/test.png")).toBe(
			"/blog/images/test.png",
		);
	});

	test("EP-BVA: flattenLegacyAssetsPath simple (Line 32)", () => {
		expect(normalizeImageSrc("assets/images/test.png")).toBe(
			"/blog/images/test.png",
		);
	});

	test("EP-BVA: parseFrontMatter key with spaces (Line 95)", () => {
		const md = "---\n  title  :  spaces  \n---\n";
		const { data } = parseFrontMatter(md);
		expect(data.title).toBe("spaces");
	});

	test("EP-BVA: parseFrontMatter with empty line in FM (Line 92)", () => {
		const md = "---\ntitle: test\n\nkey: value\n---\n";
		const { data } = parseFrontMatter(md);
		expect(data).toEqual({ title: "test", key: "value" });
	});

	test("EP-BVA: resolveRelativePath empty part (Line 13)", () => {
		expect(normalizeImageSrc("/a//b/c.png")).toBe("/blog/a/b/c.png");
	});

	test("EP-BVA: resolveRelativePath root branch (Line 18)", () => {
		// To hit Line 18 true branch, we need p to start with / after normalization
		// "//a/b" -> normalizeImageSrc removes first / -> "/a/b" passed to resolveRelativePath
		expect(normalizeImageSrc("//a/b/c.png")).toBe("/blog/a/b/c.png");
	});

	test("EP-BVA: parseFrontMatter with comments and empty lines (Line 91-93)", () => {
		const md = "---\n# Comment\n  \ntitle: test\n---\nContent";
		const { data } = parseFrontMatter(md);
		expect(data).toEqual({ title: "test" });
	});

	test("EP-BVA: parseFrontMatter with colon at index 0 (Line 93 false)", () => {
		const md = "---\n:invalid\n---\nContent";
		const { data } = parseFrontMatter(md);
		expect(data).toEqual({});
	});

	test("EP-BVA: parseFrontMatter with quoted value (Line 96-101)", () => {
		const md = "---\ntitle: \"quoted\"\ndescription: 'single'\n---\nContent";
		const { data } = parseFrontMatter(md);
		expect(data.title).toBe("quoted");
		expect(data.description).toBe("single");
	});

	test("EP-BVA: parseFrontMatter with tags (Line 103-104)", () => {
		const md = "---\ntags: a, b, c\n---\nContent";
		const { data } = parseFrontMatter(md);
		expect(data.tags).toEqual(["a", "b", "c"]);
	});

	test("EP-BVA: parseFrontMatter with boolean and number (Line 105-110)", () => {
		const md = "---\nb1: true\nb2: false\nn1: 123\n---\nContent";
		const { data } = parseFrontMatter(md);
		expect(data.b1).toBe(true);
		expect(data.b2).toBe(false);
		expect(data.n1).toBe(123);
	});

	test("EP-BVA: 다양한 데이터 타입 파싱 (boolean, number, quotes)", () => {
		const md = `---
published: true
draft: false
count: 123
title: "Quoted Title"
desc: 'Single Quoted'
invalid:
:starts-with-colon
# comment line
---
Content`;
		const { data } = parseFrontMatter(md);
		expect(data.published).toBe(true);
		expect(data.draft).toBe(false);
		expect(data.count).toBe(123);
		expect(data.title).toBe("Quoted Title");
		expect(data.desc).toBe("Single Quoted");
		expect(data.invalid).toBe(""); // Line 93: colonIndex > 0, value is empty
		expect(data[":starts-with-colon"]).toBeUndefined(); // Line 93: colonIndex is 0, so not > 0
	});

	test("EP-BVA: 빈 FrontMatter 처리", () => {
		const md = "---\n---\nBody";
		const { data, content } = parseFrontMatter(md);
		expect(data).toEqual({});
		expect(content).toBe("Body");
	});

	test("EP-BVA: FrontMatter가 없는 경우", () => {
		const md = "Just content";
		const { data, content } = parseFrontMatter(md);
		expect(data).toEqual({});
		expect(content).toBe("Just content");
	});
});
