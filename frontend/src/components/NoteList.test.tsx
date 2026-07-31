import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NoteList from "./NoteList";
import type { Note } from "../api/notes";

const notes: Note[] = [
  { id: 1, text: "Buy milk", created_at: "2026-07-31T09:15:00+00:00" },
  { id: 2, text: "Water the plants", created_at: "2026-07-31T09:16:00+00:00" },
];

describe("NoteList", () => {
  it("renders one list item per note, in the given order", () => {
    render(<NoteList notes={notes} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Buy milk");
    expect(items[1]).toHaveTextContent("Water the plants");
  });

  it("gives every item a stable per-note test id", () => {
    render(<NoteList notes={notes} />);

    expect(screen.getByTestId("note-list-item-1")).toHaveTextContent("Buy milk");
    expect(screen.getByTestId("note-list-item-2")).toHaveTextContent("Water the plants");
  });

  it("renders the empty state when there are no notes", () => {
    render(<NoteList notes={[]} />);

    expect(screen.getByTestId("note-list-empty")).toBeVisible();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("keeps the list container present whether or not there are notes", () => {
    const { rerender } = render(<NoteList notes={[]} />);
    expect(screen.getByTestId("note-list")).toBeInTheDocument();

    rerender(<NoteList notes={notes} />);
    expect(screen.getByTestId("note-list")).toBeInTheDocument();
    expect(screen.queryByTestId("note-list-empty")).not.toBeInTheDocument();
  });
});
