import { describe, expect, test } from "vitest";
import { parseMarkdown } from "../src/lib/markdown";

function extractImgSrcs(html: string) {
	const out: string[] = [];
	const re = /<img\s+[^>]*src=["']([^"']*)["'][^>]*>/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(html))) out.push(m[1]);
	return out;
}

describe("parseMarkdown", () => {
	test("이미지 경로 정규화 (Normalization)", () => {
		const cases = [
			{
				md: "![a](../assets/images/09/wandb-lfw-insightface-arcface.svg)",
				expect: "/blog/images/09-wandb-lfw-insightface-arcface.svg",
			},
			{
				md: "![a](/assets/images/09/wandb-lfw-insightface-arcface.svg)",
				expect: "/blog/images/09-wandb-lfw-insightface-arcface.svg",
			},
			{
				md: "![a](assets/images/09/wandb-lfw-insightface-arcface.svg)",
				expect: "/blog/images/09-wandb-lfw-insightface-arcface.svg",
			},
			{
				md: "![a](/blog/assets/images/09/wandb-lfw-insightface-arcface.svg)",
				expect: "/blog/images/09-wandb-lfw-insightface-arcface.svg",
			},
			{
				md: '<img src="/assets/images/09/wandb-lfw-insightface-arcface.svg" alt="a" />',
				expect: "/blog/images/09-wandb-lfw-insightface-arcface.svg",
			},
		];

		for (const c of cases) {
			const { html } = parseMarkdown(c.md);
			const srcs = extractImgSrcs(html);
			expect(srcs).toHaveLength(1);
			expect(srcs[0]).toBe(c.expect);
		}
	});

	test("EP-BVA: 경계값 및 특수 케이스 처리", () => {
		const cases = [
			{ md: "", expectCount: 0 },
			{ md: "![no-image]()", expectCount: 1, expectSrc: "" },
			{
				md: "![special](assets/images/01/../02/test.png)",
				expect: "/blog/images/02-test.png",
			},
			{
				md: "![abs](/blog/images/already.png)",
				expect: "/blog/images/already.png",
			},
		];

		for (const c of cases) {
			const { html } = parseMarkdown(c.md);
			const srcs = extractImgSrcs(html);
			if (c.expectCount !== undefined) {
				expect(srcs).toHaveLength(c.expectCount);
			}
			if (c.expectSrc !== undefined && srcs.length > 0) {
				expect(srcs[0]).toBe(c.expectSrc);
			}
			if (c.expect !== undefined && srcs.length > 0) {
				expect(srcs[0]).toBe(c.expect);
			}
		}
	});

	test("EP-BVA: 다중 이미지 처리", () => {
		const md = "![1](assets/images/01/a.png) ![2](assets/images/02/b.png)";
		const { html } = parseMarkdown(md);
		const srcs = extractImgSrcs(html);
		expect(srcs).toHaveLength(2);
		expect(srcs[0]).toBe("/blog/images/01-a.png");
		expect(srcs[1]).toBe("/blog/images/02-b.png");
	});

	test("FrontMatter 파싱 테스트", () => {
		const md = `---\ntitle: Test\ntags: t1 t2\n---\n# Content`;
		const { frontMatter, html } = parseMarkdown(md);
		expect(frontMatter).toEqual({ title: "Test", tags: ["t1", "t2"] });
		expect(html).toContain("<h1>Content</h1>");
	});
});
