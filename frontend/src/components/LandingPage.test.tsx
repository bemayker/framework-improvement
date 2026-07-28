import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingPage from "./LandingPage";
import { version } from "../../package.json";

// The page loads notes on mount, so every test stubs the HTTP boundary.
const fetchMock = vi.fn();

describe("LandingPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the app title 'Task Notes'", async () => {
    render(<LandingPage />);

    expect(screen.getByTestId("landing-title")).toHaveTextContent("Task Notes");
    await screen.findByTestId("note-list");
  });

  it("renders the landing page container", async () => {
    render(<LandingPage />);

    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
    await screen.findByTestId("note-list");
  });

  it("renders the title as a heading for accessibility", async () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Task Notes" })).toBeInTheDocument();
    await screen.findByTestId("note-list");
  });

  it("renders the footer with the app name and version", async () => {
    render(<LandingPage />);

    expect(screen.getByTestId("app-footer")).toHaveTextContent("Task Notes");
    expect(screen.getByTestId("app-footer")).toHaveTextContent(version);
    await screen.findByTestId("note-list");
  });

  it("renders the notes section with the form and the loaded list", async () => {
    render(<LandingPage />);

    expect(screen.getByTestId("notes-section")).toBeInTheDocument();
    expect(screen.getByTestId("note-form")).toBeInTheDocument();
    expect(await screen.findByTestId("note-list")).toBeInTheDocument();
    expect(screen.getByTestId("note-list-empty")).toBeInTheDocument();
  });
});
