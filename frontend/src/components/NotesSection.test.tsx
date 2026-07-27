import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import NotesSection from "./NotesSection";
import { createNote, fetchNotes } from "../api/notesApi";
import type { Note } from "../api/notesApi";

vi.mock("../api/notesApi", () => ({
  fetchNotes: vi.fn(),
  createNote: vi.fn(),
}));

const mockedFetchNotes = vi.mocked(fetchNotes);
const mockedCreateNote = vi.mocked(createNote);

describe("NotesSection", () => {
  beforeEach(() => {
    mockedFetchNotes.mockReset();
    mockedCreateNote.mockReset();
  });

  it("loads notes on mount and renders them", async () => {
    const existing: Note[] = [
      { id: 1, content: "Buy milk", created_at: "2026-07-27T10:15:00+00:00" },
    ];
    mockedFetchNotes.mockResolvedValue(existing);

    render(<NotesSection />);

    await waitFor(() => expect(screen.getByTestId("note-list")).toBeInTheDocument());
    expect(screen.getByTestId("note-list-item-1")).toHaveTextContent("Buy milk");
  });

  it("appends the created note to state without refetching, on a successful submit", async () => {
    mockedFetchNotes.mockResolvedValue([]);
    mockedCreateNote.mockResolvedValue({
      id: 2,
      content: "Call the dentist",
      created_at: "2026-07-27T10:16:30+00:00",
    });

    render(<NotesSection />);
    await waitFor(() => expect(screen.getByTestId("note-list-empty")).toBeInTheDocument());

    fireEvent.change(screen.getByTestId("note-form-input"), {
      target: { value: "Call the dentist" },
    });
    fireEvent.submit(screen.getByTestId("note-form"));

    await waitFor(() => expect(screen.getByTestId("note-list-item-2")).toBeInTheDocument());
    expect(mockedFetchNotes).toHaveBeenCalledTimes(1);
  });

  it("surfaces a failed create as a visible error message", async () => {
    mockedFetchNotes.mockResolvedValue([]);
    mockedCreateNote.mockRejectedValue(new Error("Request failed with status 500"));

    render(<NotesSection />);
    await waitFor(() => expect(screen.getByTestId("note-list-empty")).toBeInTheDocument());

    fireEvent.change(screen.getByTestId("note-form-input"), { target: { value: "Buy milk" } });
    fireEvent.submit(screen.getByTestId("note-form"));

    await waitFor(() => expect(screen.getByTestId("notes-error")).toBeInTheDocument());
    expect(screen.getByTestId("notes-error")).toHaveTextContent(
      "Request failed with status 500",
    );
  });

  it("surfaces a failed initial load as a visible error message", async () => {
    mockedFetchNotes.mockRejectedValue(
      new Error("Could not reach the server. Check your connection and try again."),
    );

    render(<NotesSection />);

    await waitFor(() => expect(screen.getByTestId("notes-error")).toBeInTheDocument());
  });
});
