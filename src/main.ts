import App from "./App.svelte";

const target = document.getElementById("app");
let app;

if (target) {
	app = new App({
		target: target,
	});
}

export default app;
