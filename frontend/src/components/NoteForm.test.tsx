import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NoteForm from "./NoteForm";

describe("NoteForm", () => {
  it("renders the input and submit button", () => {
    render(<NoteForm onSubmit={vi.fn()} />);

    expect(screen.getByTestId("note-form-input")).toBeInTheDocument();
    expect(screen.getByTestId("note-form-submit")).toBeInTheDocument();
  });

  it("shows a validation error and does not call onSubmit when the input is empty", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.submit(screen.getByTestId("note-form"));

    expect(screen.getByTestId("note-form-error")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a validation error and does not call onSubmit when the input is whitespace-only", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByTestId("note-form-input"), { target: { value: "   " } });
    fireEvent.submit(screen.getByTestId("note-form"));

    expect(screen.getByTestId("note-form-error")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the trimmed content and clears the input on a valid submit", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);

    const input = screen.getByTestId("note-form-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  Buy milk  " } });
    fireEvent.submit(screen.getByTestId("note-form"));

    expect(onSubmit).toHaveBeenCalledWith("Buy milk");
    expect(input.value).toBe("");
    expect(screen.queryByTestId("note-form-error")).not.toBeInTheDocument();
  });

  it("clears a previously shown error on the next valid submit", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.submit(screen.getByTestId("note-form"));
    expect(screen.getByTestId("note-form-error")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("note-form-input"), {
      target: { value: "Call the dentist" },
    });
    fireEvent.submit(screen.getByTestId("note-form"));

    expect(screen.queryByTestId("note-form-error")).not.toBeInTheDocument();
  });
});
