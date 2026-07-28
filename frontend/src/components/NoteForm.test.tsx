import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NoteForm from "./NoteForm";

describe("NoteForm", () => {
  it("submits the trimmed note text once and clears the input", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByTestId("note-input"), { target: { value: "  Buy milk  " } });
    fireEvent.click(screen.getByTestId("note-submit"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("Buy milk");
    expect(screen.getByTestId("note-input")).toHaveValue("");
  });

  it("shows a validation message and calls nothing when the input is empty", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId("note-submit"));

    expect(screen.getByTestId("note-error")).toHaveTextContent("Note text is required.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a validation message and calls nothing when the input is whitespace-only", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByTestId("note-input"), { target: { value: "    " } });
    fireEvent.click(screen.getByTestId("note-submit"));

    expect(screen.getByTestId("note-error")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
