<script lang="ts">
import { onMount } from "svelte";
import { giscusConfig } from "../lib/giscus-config";

// Use configuration or allow override via props
// Use configuration or allow override via props
export const repo = giscusConfig.repo;
export const repoId = giscusConfig.repoId;
export const category = giscusConfig.category;
export const categoryId = giscusConfig.categoryId;
// Allow override of mapping via props
export const mapping = giscusConfig.mapping;
export const term = ""; // Used when mapping is 'specific'
export const strict = giscusConfig.strict;
export const reactionsEnabled = giscusConfig.reactionsEnabled;
export const emitMetadata = giscusConfig.emitMetadata;
export const inputPosition = giscusConfig.inputPosition;
export let theme = giscusConfig.theme;
export const lang = giscusConfig.lang;

let giscusLoaded = false;
let container;
let monitoringTimeouts = [];

onMount(() => {
	loadGiscus();

	// Cleanup function for component unmount
	return () => {
		// Clear all pending timeouts to prevent errors after unmount
		monitoringTimeouts.forEach((timeoutId) => {
			clearTimeout(timeoutId);
		});
		monitoringTimeouts = [];
	};
});

async function loadGiscus() {
	if (giscusLoaded) return;

	// Only debug in development
	if (import.meta.env.DEV) {
		console.group("🔍 Giscus Debug Information");
		console.log("Repository:", repo);
		console.log("Repository ID:", repoId);
		console.log("Category:", category);
		console.log("Category ID:", categoryId);
		console.log("Mapping:", mapping);
		console.log("Term:", term);
		console.log("Debug mode enabled");
	}

	// Check if all required values are present
	if (!repo || !repoId || !categoryId) {
		console.error("❌ Missing required Giscus configuration:");
		console.error("Repo:", repo);
		console.error("Repo ID:", repoId);
		console.error("Category ID:", categoryId);
		if (import.meta.env.DEV) {
			console.groupEnd();
		}
		return;
	}

	if (import.meta.env.DEV) {
		console.log("✅ All required configuration values present");
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

	// API URL and parameters logged for debugging purposes
	// console.log('📡 Giscus API URL:', apiUrl.toString());

	// Note: Direct API testing removed to prevent CORS errors
	// Giscus handles API calls internally through its script

	if (import.meta.env.DEV) {
		console.groupEnd();
	}

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
		if (import.meta.env.DEV) {
			console.log("✅ Giscus script loaded successfully");
		}
	});

	script.addEventListener("error", (e) => {
		console.error("❌ Giscus script failed to load:", e);
	});

	if (container) {
		container.innerHTML = "";
		container.appendChild(script);
		giscusLoaded = true;

		// Monitor for iframe creation (minimal logging)
		const monitorIframe = () => {
			// Defensive checks to prevent null reference errors
			if (!container || !container.isConnected) {
				if (import.meta.env.DEV) {
					console.warn("⚠️ Container not available for iframe monitoring");
				}
				return false;
			}

			const iframe = container.querySelector("iframe");
			if (iframe) {
				if (import.meta.env.DEV) {
					console.log("🖼️ Giscus iframe created");
				}

				iframe.addEventListener("load", () => {
					if (import.meta.env.DEV) {
						console.log("✅ Giscus iframe loaded");
					}
				});

				iframe.addEventListener("error", (e) => {
					console.error("❌ [Comments] Giscus iframe 에러 발생:", {
						message: e instanceof Error ? e.message : "Iframe error event",
						event: e,
					});
				});

				return true;
			} else {
				if (import.meta.env.DEV) {
					console.warn("⚠️ [Comments] Giscus iframe을 찾을 수 없음");
				}
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
		if (import.meta.env.DEV) {
			console.warn(
				"⚠️ [Comments] 테마 업데이트를 위한 컨테이너가 준비되지 않음",
			);
		}
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

			if (import.meta.env.DEV) {
				console.log("🎨 [Comments] 테마 업데이트 성공:", newTheme);
			}
		} catch (error) {
			console.error("❌ [Comments] 테마 업데이트 중 에러 발생:", {
				newTheme,
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : "Stack trace unavailable",
				error,
			});
		}
	} else if (import.meta.env.DEV) {
		console.warn(
			"⚠️ [Comments] 테마 업데이트를 위한 Giscus iframe이 준비되지 않음",
		);
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
