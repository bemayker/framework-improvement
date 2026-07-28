import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "./LandingPage";
import { version } from "../../package.json";

// The embedded Notes component calls the notes API on mount; mocking the client
// keeps these landing-page assertions deterministic and network-free.
vi.mock("../api/notesClient", () => ({
  listNotes: vi.fn().mockResolvedValue([]),
  createNote: vi.fn(),
}));

/** Renders the page and waits for the notes list to settle after its initial load. */
async function renderLandingPage() {
  render(<LandingPage />);
  await screen.findByTestId("note-list");
}

describe("LandingPage", () => {
  it("renders the app title 'Task Notes'", async () => {
    await renderLandingPage();

    expect(screen.getByTestId("landing-title")).toHaveTextContent("Task Notes");
  });

  it("renders the landing page container", async () => {
    await renderLandingPage();

    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
  });

  it("renders the title as a heading for accessibility", async () => {
    await renderLandingPage();

    expect(screen.getByRole("heading", { name: "Task Notes" })).toBeInTheDocument();
  });

  it("renders the footer with the app name and version", async () => {
    await renderLandingPage();

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    expect(screen.getByTestId("app-footer")).toHaveTextContent(version);
  });

  it("renders the note form inside the main region", async () => {
    await renderLandingPage();

    expect(screen.getByRole("main")).toContainElement(screen.getByTestId("note-form"));
  });
});
