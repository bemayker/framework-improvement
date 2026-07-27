import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "./LandingPage";

// LandingPage now mounts NotesSection, which fetches notes on mount. Mock the
// API client so these pre-existing assertions never trigger a real network
// call (TEST-01's LandingPage tests predate the notes feature).
vi.mock("../api/notesApi", () => ({
  fetchNotes: vi.fn().mockResolvedValue([]),
  createNote: vi.fn(),
}));

describe("LandingPage", () => {
  it("renders the app title 'Task Notes'", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("landing-title")).toHaveTextContent("Task Notes");
  });

  it("renders the landing page container", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
  });

  it("renders the title as a heading for accessibility", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Task Notes" })).toBeInTheDocument();
  });
});
