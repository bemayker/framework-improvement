import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NoteList from "./NoteList";

describe("NoteList", () => {
  it("renders the list container when there are no notes", () => {
    render(<NoteList notes={[]} />);

    expect(screen.getByTestId("note-list")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("renders one item per note, keyed by the note id", () => {
    render(
      <NoteList
        notes={[
          { id: 1, text: "Buy milk" },
          { id: 2, text: "Walk dog" },
        ]}
      />,
    );

    expect(screen.getByTestId("note-list-item-1")).toHaveTextContent("Buy milk");
    expect(screen.getByTestId("note-list-item-2")).toHaveTextContent("Walk dog");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("exposes the list with an accessible name", () => {
    render(<NoteList notes={[{ id: 1, text: "Buy milk" }]} />);

    expect(screen.getByRole("list", { name: "Saved notes" })).toHaveAttribute(
      "data-testid",
      "note-list",
    );
  });
});
