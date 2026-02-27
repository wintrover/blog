import { render, screen } from "@testing-library/svelte";
import { describe, expect, test, vi } from "vitest";
import Footer from "../src/components/Footer.svelte";
import { siteConfig } from "../src/lib/config";

// Mock siteConfig
vi.mock("../src/lib/config", () => ({
	siteConfig: {
		social: {
			email: "test@example.com",
			github: "testuser",
			instagram: "testinst",
			linkedin: "testlink",
		},
	},
}));

describe("Footer Component", () => {
	test("소셜 링크들이 올바르게 렌더링되어야 함", () => {
		render(Footer);

		const emailLink = screen.getByTitle("Email");
		expect(emailLink).toHaveAttribute("href", "mailto:test@example.com");

		const githubLink = screen.getByTitle("GitHub");
		expect(githubLink).toHaveAttribute("href", "https://github.com/testuser");

		const instagramLink = screen.getByTitle("Instagram");
		expect(instagramLink).toHaveAttribute(
			"href",
			"https://instagram.com/testinst",
		);

		const linkedinLink = screen.getByTitle("LinkedIn");
		expect(linkedinLink).toHaveAttribute(
			"href",
			"https://linkedin.com/in/testlink",
		);
	});

	test("소셜 정보가 없을 경우 링크가 렌더링되지 않아야 함", () => {
		vi.mocked(siteConfig).social = {
			email: "",
			github: "",
			instagram: "",
			linkedin: "",
		};

		render(Footer);

		expect(screen.queryByTitle("Email")).not.toBeInTheDocument();
		expect(screen.queryByTitle("GitHub")).not.toBeInTheDocument();
		expect(screen.queryByTitle("Instagram")).not.toBeInTheDocument();
		expect(screen.queryByTitle("LinkedIn")).not.toBeInTheDocument();
	});
});
