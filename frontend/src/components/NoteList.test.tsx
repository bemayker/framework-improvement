import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NoteList from "./NoteList";
import type { Note } from "../api/notes";

const notes: Note[] = [
  { id: 1, content: "Buy milk", created_at: "2026-07-30T12:00:00Z" },
  { id: 2, content: "Walk the dog", created_at: "2026-07-30T12:01:00Z" },
];

describe("NoteList", () => {
  it("renders one item per note, in the order given", () => {
    render(<NoteList notes={notes} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Buy milk");
    expect(items[1]).toHaveTextContent("Walk the dog");
  });

  it("gives every note a stable test id derived from its id", () => {
    render(<NoteList notes={notes} />);

    expect(screen.getByTestId("note-list-item-1")).toHaveTextContent("Buy milk");
    expect(screen.getByTestId("note-list-item-2")).toHaveTextContent("Walk the dog");
  });

  it("renders an empty list when there are no notes", () => {
    render(<NoteList notes={[]} />);

    expect(screen.getByTestId("note-list")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
