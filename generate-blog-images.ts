import path from "node:path";
import { convertMermaidToImage } from "./scripts/mermaid-to-image.ts";

const outputDir = "public/images";

async function generateImages() {
	// First mermaid diagram - Docker Network Architecture
	const dockerNetworkDiagram = `
graph TD
    A[Host Machine] --> B[Port 80]
    B --> C[Traefik Container]
    C --> D[Traefik Network]
    D --> E[Backend Container]
    D --> F[Frontend Container]
    D --> G[Database Container]

    style D fill:#e1f5fe
    style C fill:#f3e5f5
  `;

	// Second mermaid diagram - Final Architecture
	const finalArchitectureDiagram = `
graph TB
    subgraph "Development Machine"
        A[Traefik Proxy :80]
        B[Feature Env :8080]
        C[Hotfix Env :8081]
        D[Testing Env :8082]
    end

    subgraph "Feature Environment"
        E[Frontend Container]
        F[Backend Container]
        G[Database Container]
        H[Redis Container]
    end

    subgraph "Monorepo Structure"
        I[apps/backend]
        J[apps/frontend]
        K[packages/kyc-core]
        L[packages/shared-utils]
    end

    A --> B
    A --> C
    A --> D
    B --> E
    B --> F
    B --> G
    B --> H

    F --> I
    E --> J
    F --> K
    E --> L

    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#f3e5f5
    style D fill:#f3e5f5
  `;

	try {
		// Generate first image
		await convertMermaidToImage(
			dockerNetworkDiagram,
			path.join(outputDir, "2025-11-30-14-docker-network.png"),
		);
		console.log("Generated Docker network diagram");

		// Generate second image
		await convertMermaidToImage(
			finalArchitectureDiagram,
			path.join(outputDir, "2025-11-30-14-final-architecture.png"),
		);
		console.log("Generated final architecture diagram");

		console.log("All images generated successfully!");
	} catch (error) {
		console.error("Error generating images:", error);
	}
}

generateImages();
