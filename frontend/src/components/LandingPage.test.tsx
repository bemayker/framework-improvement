import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LandingPage from "./LandingPage";

function stubEmptyNotesFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    } as Response),
  );
}

describe("LandingPage", () => {
  beforeEach(() => {
    stubEmptyNotesFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the app title 'Task Notes'", async () => {
    render(<LandingPage />);

    expect(screen.getByTestId("landing-title")).toHaveTextContent("Task Notes");
    await waitFor(() => expect(screen.getByTestId("note-list-empty")).toBeInTheDocument());
  });

  it("renders the landing page container", async () => {
    render(<LandingPage />);

    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("note-list-empty")).toBeInTheDocument());
  });

  it("renders the title as a heading for accessibility", async () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Task Notes" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("note-list-empty")).toBeInTheDocument());
  });

  it("renders the notes section with the form and the notes list", async () => {
    render(<LandingPage />);

    expect(screen.getByTestId("notes-section")).toBeInTheDocument();
    expect(screen.getByTestId("note-form")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId("note-list-empty")).toBeInTheDocument());
  });
});
