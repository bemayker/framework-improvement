import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NoteList from "./NoteList";
import type { Note } from "../api/notesApi";

const notes: Note[] = [
  { id: 1, content: "Buy milk", created_at: "2026-07-27T10:15:00+00:00" },
  { id: 2, content: "Call the dentist", created_at: "2026-07-27T10:16:30+00:00" },
];

describe("NoteList", () => {
  it("renders the empty state when there are no notes", () => {
    render(<NoteList notes={[]} />);

    expect(screen.getByTestId("note-list-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("note-list")).not.toBeInTheDocument();
  });

  it("renders each note with a stable, unique test id", () => {
    render(<NoteList notes={notes} />);

    expect(screen.getByTestId("note-list")).toBeInTheDocument();
    expect(screen.getByTestId("note-list-item-1")).toHaveTextContent("Buy milk");
    expect(screen.getByTestId("note-list-item-2")).toHaveTextContent("Call the dentist");
  });

  it("renders notes in the order given (insertion order, newest last)", () => {
    render(<NoteList notes={notes} />);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Buy milk");
    expect(items[1]).toHaveTextContent("Call the dentist");
  });
});
