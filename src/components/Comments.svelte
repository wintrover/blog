<script lang="ts">
import { onMount } from "svelte";
import { giscusConfig } from "../lib/giscus-config";

// Use configuration or allow override via props
export let repo = giscusConfig.repo;
export let repoId = giscusConfig.repoId;
export let category = giscusConfig.category;
export let categoryId = giscusConfig.categoryId;
export let mapping = giscusConfig.mapping;
export let term = ""; // Used when mapping is 'specific'
export let strict = giscusConfig.strict;
export let reactionsEnabled = giscusConfig.reactionsEnabled;
export let emitMetadata = giscusConfig.emitMetadata;
export let inputPosition = giscusConfig.inputPosition;
export let theme = giscusConfig.theme;
export let lang = giscusConfig.lang;

// Accept additional props from parent to avoid warnings
export let slug = "";
export let title = "";

let giscusLoaded = false;
let container;
let monitoringTimeouts = [];

onMount(() => {
	loadGiscus();

	// Add message listener for Giscus communication monitoring
	window.addEventListener("message", handleMessage);

	// Cleanup function for component unmount
	return () => {
		window.removeEventListener("message", handleMessage);
		// Clear all pending timeouts to prevent errors after unmount
		monitoringTimeouts.forEach((timeoutId) => {
			clearTimeout(timeoutId);
		});
		monitoringTimeouts = [];
	};
});

function handleMessage(event: MessageEvent) {
	// Only listen to messages from Giscus
	if (event.origin !== "https://giscus.app") return;

	const { data } = event;
	if (!(typeof data === "object" && data.giscus)) return;

	const giscusData = data.giscus;

	// Handle specific error messages from Giscus (Advanced Usage)
	if ("error" in giscusData) {
		console.error("❌ Giscus Error:", giscusData.error);
		return;
	}

	// Log Giscus messages if debug is enabled
	if (giscusConfig.debug) {
		console.log("💬 Giscus Message:", giscusData);
	}
}

async function loadGiscus() {
	if (giscusLoaded) return;

	// Check if all required values are present
	if (!repo || !repoId || !categoryId) {
		console.error("❌ Missing required Giscus configuration:", {
			repo,
			repoId,
			category,
			categoryId,
			mapping,
			term,
		});
		return;
	}

	// Build the URL that Giscus will call
	const apiUrl = new URL("https://giscus.app/api/discussions");
	apiUrl.searchParams.append("repo", repo);
	if (mapping === "specific" && term) {
		apiUrl.searchParams.append("term", term);
	}
	apiUrl.searchParams.append("category", category);
	apiUrl.searchParams.append("number", "0");
	apiUrl.searchParams.append("strict", strict);
	apiUrl.searchParams.append("first", "15");

	const script = document.createElement("script");
	script.src = "https://giscus.app/client.js";
	script.setAttribute("data-repo", repo);
	script.setAttribute("data-repo-id", repoId);
	script.setAttribute("data-category", category);
	script.setAttribute("data-category-id", categoryId);
	script.setAttribute("data-mapping", mapping);
	if (mapping === "specific" && term) {
		script.setAttribute("data-term", term);
	}
	script.setAttribute("data-strict", strict);
	script.setAttribute("data-reactions-enabled", reactionsEnabled);
	script.setAttribute("data-emit-metadata", emitMetadata);
	script.setAttribute("data-input-position", inputPosition);
	script.setAttribute("data-theme", theme);
	script.setAttribute("data-lang", lang);
	script.setAttribute("crossorigin", "anonymous");
	script.async = true;

	// Add event listeners
	script.addEventListener("load", () => {
		// script 로드 완료 (로그 삭제됨)
	});

	script.addEventListener("error", (e) => {
		console.error("❌ Giscus script failed to load:", {
			error: e,
			repo,
			repoId,
			categoryId,
		});
	});

	if (container) {
		container.innerHTML = "";
		container.appendChild(script);
		giscusLoaded = true;

		// Monitor for iframe creation
		const monitorIframe = () => {
			// Defensive checks to prevent null reference errors
			if (!container || !container.isConnected) {
				return false;
			}

			const iframe = container.querySelector("iframe");
			if (iframe) {
				iframe.addEventListener("load", () => {
					// iframe 로드 완료 (로그 삭제됨)
				});

				iframe.addEventListener("error", (e) => {
					console.error("❌ [Comments] Giscus iframe 에러 발생:", {
						message: e instanceof Error ? e.message : "Iframe error event",
						event: e,
						config: { repo, repoId, categoryId },
					});
				});

				return true;
			} else {
				// iframe을 찾을 수 없음 (로그 삭제됨)
				return false;
			}
		};

		// Try multiple times with increasing delays, tracking timeouts for cleanup
		const timeout1 = setTimeout(monitorIframe, 2000);
		const timeout2 = setTimeout(monitorIframe, 5000);
		const timeout3 = setTimeout(monitorIframe, 10000);

		monitoringTimeouts.push(timeout1, timeout2, timeout3);
	}
}

// Function to update theme (optional)
export function updateTheme(newTheme) {
	theme = newTheme;

	// Defensive checks before accessing iframe
	if (!container || !container.isConnected) {
		return;
	}

	const iframe = container.querySelector("iframe");
	if (iframe?.contentWindow) {
		try {
			iframe.contentWindow.postMessage(
				{
					giscus: {
						setConfig: {
							theme: newTheme,
						},
					},
				},
				"https://giscus.app",
			);
		} catch (error) {
			console.error("❌ [Comments] 테마 업데이트 중 에러 발생:", {
				newTheme,
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : "Stack trace unavailable",
				error,
			});
		}
	}
}
</script>

<div bind:this={container} class="giscus-wrapper"></div>

<style>
  .giscus-wrapper {
    margin-top: 60px;
    padding-top: 40px;
    border-top: 1px solid #e1e4e8;
    min-height: 200px;
  }

  /* Giscus iframe responsive */
  .giscus-wrapper :global(iframe) {
    width: 100%;
    min-height: 200px;
    border: none;
  }

  /* Dark theme support */
  @media (prefers-color-scheme: dark) {
    .giscus-wrapper {
      border-top-color: #30363d;
    }
  }
</style>
