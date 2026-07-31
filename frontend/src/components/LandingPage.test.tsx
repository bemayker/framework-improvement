import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LandingPage from "./LandingPage";
import { version } from "../../package.json";
import { createNote, listNotes } from "../api/notes";
import type { Note } from "../api/notes";

vi.mock("../api/notes", () => ({
  listNotes: vi.fn(),
  createNote: vi.fn(),
}));

const listNotesMock = vi.mocked(listNotes);
const createNoteMock = vi.mocked(createNote);

const savedNote: Note = {
  id: 1,
  text: "Buy milk",
  created_at: "2026-07-31T09:15:00+00:00",
};

/** Renders the page and waits for the on-mount load to settle, so no state update escapes act(). */
async function renderLandingPage() {
  render(<LandingPage />);
  await waitFor(() => expect(listNotesMock).toHaveBeenCalledTimes(1));
}

beforeEach(() => {
  vi.resetAllMocks();
  listNotesMock.mockResolvedValue([]);
});

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
});

describe("LandingPage notes section", () => {
  it("renders the notes section with the form and the list", async () => {
    await renderLandingPage();

    expect(screen.getByTestId("notes-section")).toBeInTheDocument();
    expect(screen.getByTestId("note-form")).toBeInTheDocument();
    expect(screen.getByTestId("note-list")).toBeInTheDocument();
  });

  it("loads the saved notes on mount", async () => {
    listNotesMock.mockResolvedValue([savedNote]);

    await renderLandingPage();

    expect(await screen.findByTestId("note-list-item-1")).toHaveTextContent("Buy milk");
    expect(screen.queryByTestId("note-list-empty")).not.toBeInTheDocument();
  });

  it("shows the empty state when the backend returns no notes", async () => {
    await renderLandingPage();

    expect(screen.getByTestId("note-list-empty")).toBeVisible();
    expect(screen.queryByTestId("notes-error")).not.toBeInTheDocument();
  });

  it("appends a created note to the list without reloading", async () => {
    createNoteMock.mockResolvedValue(savedNote);

    await renderLandingPage();

    fireEvent.change(screen.getByTestId("note-form-input"), {
      target: { value: "Buy milk" },
    });
    fireEvent.click(screen.getByTestId("note-form-submit"));

    expect(await screen.findByTestId("note-list-item-1")).toHaveTextContent("Buy milk");
    expect(createNoteMock).toHaveBeenCalledWith("Buy milk");
    expect(listNotesMock).toHaveBeenCalledTimes(1);
  });

  it("makes no API call when an empty note is submitted", async () => {
    await renderLandingPage();

    fireEvent.click(screen.getByTestId("note-form-submit"));

    expect(screen.getByTestId("note-form-error")).toBeVisible();
    expect(createNoteMock).not.toHaveBeenCalled();
  });

  it("shows an error line when the notes cannot be loaded", async () => {
    listNotesMock.mockRejectedValue(new Error("network down"));

    await renderLandingPage();

    expect(await screen.findByTestId("notes-error")).toHaveTextContent(
      "Your notes could not be loaded.",
    );
  });

  it("shows an error line when a note cannot be saved", async () => {
    createNoteMock.mockRejectedValue(new Error("network down"));

    await renderLandingPage();

    fireEvent.change(screen.getByTestId("note-form-input"), {
      target: { value: "Buy milk" },
    });
    fireEvent.click(screen.getByTestId("note-form-submit"));

    expect(await screen.findByTestId("notes-error")).toHaveTextContent(
      "Your note could not be saved.",
    );
    expect(screen.getByTestId("note-form-input")).toHaveValue("Buy milk");
  });
});
