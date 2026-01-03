import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [svelte({ preprocess: vitePreprocess({ script: true }) })],
	base: "/blog/",
	build: {
		outDir: "dist",
		copyPublicDir: true,
		rollupOptions: {
			output: {
				manualChunks: undefined,
			},
		},
	},
	assetsInclude: ["**/*.md"],
	publicDir: "public",
	test: {
		globals: true,
		environment: "node",
		include: ["tests/**/*.test.ts"],
		env: {
			BASE_URL: "/blog/",
		},
	},
	server: {
		historyApiFallback: true,
	},
	preview: {
		historyApiFallback: true,
	},
});
