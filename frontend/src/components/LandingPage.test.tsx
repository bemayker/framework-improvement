import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LandingPage from "./LandingPage";
import { createNote, fetchNotes, type Note } from "../api/notes";
import { version } from "../../package.json";

vi.mock("../api/notes", () => ({
  fetchNotes: vi.fn(),
  createNote: vi.fn(),
}));

const fetchNotesMock = vi.mocked(fetchNotes);
const createNoteMock = vi.mocked(createNote);

const savedNote: Note = { id: 1, content: "Buy milk", created_at: "2026-07-30T12:00:00Z" };

beforeEach(() => {
  vi.resetAllMocks();
  fetchNotesMock.mockResolvedValue([]);
  createNoteMock.mockResolvedValue(savedNote);
});

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

  it("renders the note form and the note list", async () => {
    await renderLandingPage();

    expect(screen.getByTestId("note-form")).toBeInTheDocument();
    expect(screen.getByTestId("note-list")).toBeInTheDocument();
  });

  it("lists the notes fetched on mount", async () => {
    fetchNotesMock.mockResolvedValue([
      savedNote,
      { id: 2, content: "Walk the dog", created_at: "2026-07-30T12:01:00Z" },
    ]);

    await renderLandingPage();

    expect(await screen.findByTestId("note-list-item-1")).toHaveTextContent("Buy milk");
    expect(screen.getByTestId("note-list-item-2")).toHaveTextContent("Walk the dog");
    expect(fetchNotesMock).toHaveBeenCalledTimes(1);
  });

  it("appends a submitted note to the list without refetching", async () => {
    await renderLandingPage();

    fireEvent.change(screen.getByTestId("note-input"), { target: { value: "Buy milk" } });
    fireEvent.click(screen.getByTestId("note-submit"));

    expect(await screen.findByTestId("note-list-item-1")).toHaveTextContent("Buy milk");
    expect(createNoteMock).toHaveBeenCalledWith("Buy milk");
    expect(fetchNotesMock).toHaveBeenCalledTimes(1);
  });

  it("reports an error when the saved notes cannot be loaded", async () => {
    fetchNotesMock.mockRejectedValue(new Error("api down"));

    render(<LandingPage />);

    expect(await screen.findByTestId("notes-load-error")).toBeVisible();
    await waitFor(() => expect(screen.queryAllByRole("listitem")).toHaveLength(0));
  });
});
