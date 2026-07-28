import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NoteList from "./NoteList";
import type { Note } from "../api/notes";

const notes: Note[] = [
  { id: 2, text: "Call the dentist", created_at: "2026-07-28T09:44:02.011Z" },
  { id: 1, text: "Buy milk", created_at: "2026-07-28T09:41:12.334Z" },
];

describe("NoteList", () => {
  it("renders notes in the order given (newest first)", () => {
    render(<NoteList notes={notes} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Call the dentist");
    expect(items[1]).toHaveTextContent("Buy milk");
    expect(screen.getByTestId("note-item-2")).toBeInTheDocument();
    expect(screen.getByTestId("note-item-1")).toBeInTheDocument();
  });

  it("shows the empty state when there are no notes", () => {
    render(<NoteList notes={[]} />);

    expect(screen.getByTestId("note-list-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("note-list")).not.toBeInTheDocument();
  });
});
