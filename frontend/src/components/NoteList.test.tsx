import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NoteList from "./NoteList";
import type { Note } from "../api/notes";

const notes: Note[] = [
  { id: 2, text: "Call the dentist", created_at: "2026-07-28T09:44:02.011Z" },
  { id: 1, text: "Buy milk", created_at: "2026-07-28T09:41:12.334Z" },
];

describe("NoteList", () => {
  it("renders the notes in the order received, newest first", () => {
    render(<NoteList notes={notes} />);

    const rendered = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(rendered).toEqual(["Call the dentist", "Buy milk"]);
  });

  it("gives every note a test id derived from its id", () => {
    render(<NoteList notes={notes} />);

    expect(screen.getByTestId("note-item-2")).toHaveTextContent("Call the dentist");
    expect(screen.getByTestId("note-item-1")).toHaveTextContent("Buy milk");
  });

  it("renders the empty state and no note items when there are no notes", () => {
    render(<NoteList notes={[]} />);

    expect(screen.getByTestId("note-list-empty")).toHaveTextContent("No notes yet.");
    expect(screen.queryByTestId("note-item-1")).not.toBeInTheDocument();
  });

  it("keeps the list element mounted with an accessible name in both states", () => {
    const { rerender } = render(<NoteList notes={[]} />);

    expect(screen.getByRole("list", { name: "Saved notes" })).toBeInTheDocument();

    rerender(<NoteList notes={notes} />);

    expect(screen.getByRole("list", { name: "Saved notes" })).toBeInTheDocument();
  });
});
