import { strict as assert } from "node:assert";
import { absolutizeSrc } from "../scripts/post-to-dev";

export async function runDevtoAbsolutizeTests() {
	{
		const base = "https://wintrover.github.io/blog";
		assert.equal(
			absolutizeSrc("/assets/images/a.png", base),
			"https://wintrover.github.io/blog/images/a.png",
		);
		assert.equal(
			absolutizeSrc("assets/images/a.png", base),
			"https://wintrover.github.io/blog/images/a.png",
		);
	}

	{
		const base = "https://wintrover.github.io/blog/";
		assert.equal(
			absolutizeSrc("/assets/images/a.png", base),
			"https://wintrover.github.io/blog/images/a.png",
		);
		assert.equal(
			absolutizeSrc("assets/images/a.png", base),
			"https://wintrover.github.io/blog/images/a.png",
		);
	}

	{
		const base = "https://wintrover.github.io/blog";
		assert.equal(
			absolutizeSrc("/blog/assets/images/a.png", base),
			"https://wintrover.github.io/blog/images/a.png",
		);
	}

	{
		const base = "https://wintrover.github.io/blog";
		assert.equal(
			absolutizeSrc("https://example.com/x.png", base),
			"https://example.com/x.png",
		);
		const dataUri =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
		assert.equal(absolutizeSrc(dataUri, base), dataUri);
	}
}
