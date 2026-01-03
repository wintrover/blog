import { strict as assert } from "node:assert";

import { parseMarkdown } from "../src/lib/markdown";
import { runDevtoAbsolutizeTests } from "./devto-absolutize.test";

function extractImgSrcs(html: string) {
	const out: string[] = [];
	const re = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(html))) out.push(m[1]);
	return out;
}

async function testImageNormalization() {
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
		assert.equal(srcs.length, 1, `one img expected for ${c.md}`);
		assert.equal(
			srcs[0],
			c.expect,
			`normalized src should be ${c.expect} for ${c.md}`,
		);
	}
}

async function testBoundaryCases() {
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
			assert.equal(
				srcs.length,
				c.expectCount,
				`expected ${c.expectCount} images for ${c.md}`,
			);
		}
		if (c.expectSrc !== undefined && srcs.length > 0) {
			assert.equal(srcs[0], c.expectSrc);
		}
		if (c.expect !== undefined && srcs.length > 0) {
			assert.equal(srcs[0], c.expect);
		}
	}
}

(async () => {
	try {
		// 병렬 테스트 실행 (규칙 준수)
		await Promise.all([
			testImageNormalization(),
			testBoundaryCases(),
			runDevtoAbsolutizeTests(),
		]);
	} catch (err) {
		// 오류 발생 시에만 로깅 (규칙 준수)
		console.error("TEST FAILURE:", err);
		process.exit(1);
	}
})();
