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
		assert.equal(srcs.length, 1, "one img expected");
		assert.equal(srcs[0], c.expect, `normalized src should be ${c.expect}`);
	}
}

(async () => {
	try {
		await testImageNormalization();
		await runDevtoAbsolutizeTests();
		console.log("OK: image path normalization tests passed");
	} catch (err) {
		console.error("TEST FAILURE:", err);
		process.exit(1);
	}
})();
