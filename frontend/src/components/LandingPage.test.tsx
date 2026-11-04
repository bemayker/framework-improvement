import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LandingPage from "./LandingPage";
import { version } from "../../package.json";
import { listNotes, createNote } from "../api/notes";

vi.mock("../api/notes", () => ({
  listNotes: vi.fn(),
  createNote: vi.fn(),
}));

const listNotesMock = vi.mocked(listNotes);
const createNoteMock = vi.mocked(createNote);

/** Renders the page and waits for the mount-time notes load to settle. */
async function renderLandingPage() {
  render(<LandingPage />);
  await waitFor(() => expect(listNotesMock).toHaveBeenCalledTimes(1));
}

describe("LandingPage", () => {
  beforeEach(() => {
    listNotesMock.mockReset();
    createNoteMock.mockReset();
    listNotesMock.mockResolvedValue([]);
  });

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

  it("loads the saved notes once on mount and renders them", async () => {
    listNotesMock.mockResolvedValue([
      { id: 1, text: "Buy milk" },
      { id: 2, text: "Walk dog" },
    ]);

    await renderLandingPage();

    expect(await screen.findByTestId("note-list-item-1")).toHaveTextContent(
      "Buy milk",
    );
    expect(screen.getByTestId("note-list-item-2")).toHaveTextContent("Walk dog");
    expect(listNotesMock).toHaveBeenCalledTimes(1);
  });

  it("appends a submitted note to the list without reloading it", async () => {
    listNotesMock.mockResolvedValue([{ id: 1, text: "Buy milk" }]);
    createNoteMock.mockResolvedValue({ id: 2, text: "Walk dog" });

    await renderLandingPage();
    await screen.findByTestId("note-list-item-1");

    fireEvent.change(screen.getByTestId("note-input"), {
      target: { value: "Walk dog" },
    });
    fireEvent.click(screen.getByTestId("note-submit"));

    expect(await screen.findByTestId("note-list-item-2")).toHaveTextContent(
      "Walk dog",
    );
    expect(screen.getByTestId("note-list-item-1")).toBeInTheDocument();
    // The new note comes from the POST response, not from a second GET.
    expect(listNotesMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the page usable when the initial notes load fails", async () => {
    listNotesMock.mockRejectedValue(new Error("Loading notes failed: 500"));

    await renderLandingPage();

    expect(screen.getByTestId("note-form")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
