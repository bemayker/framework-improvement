import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NoteForm from "./NoteForm";

function typeAndSubmit(value: string) {
  fireEvent.change(screen.getByTestId("note-form-input"), { target: { value } });
  fireEvent.click(screen.getByTestId("note-form-submit"));
}

describe("NoteForm", () => {
  it("submits the trimmed text and clears the input on success", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteForm onSubmit={onSubmit} />);

    typeAndSubmit("  Buy milk  ");

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Buy milk"));
    await waitFor(() => expect(screen.getByTestId("note-form-input")).toHaveValue(""));
    expect(screen.queryByTestId("note-form-error")).not.toBeInTheDocument();
  });

  it("rejects an empty note with a visible message and no submit callback", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId("note-form-submit"));

    expect(screen.getByTestId("note-form-error")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only note with a visible message and no submit callback", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);

    typeAndSubmit("    ");

    expect(screen.getByTestId("note-form-error")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("announces the validation message to assistive technology", () => {
    render(<NoteForm onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByTestId("note-form-submit"));

    expect(screen.getByRole("alert")).toHaveTextContent(/enter some text/i);
  });

  it("clears a previous validation message once a valid note is submitted", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId("note-form-submit"));
    expect(screen.getByTestId("note-form-error")).toBeInTheDocument();

    typeAndSubmit("Water the plants");

    await waitFor(() =>
      expect(screen.queryByTestId("note-form-error")).not.toBeInTheDocument(),
    );
  });

  it("keeps the typed text when the submit callback rejects", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("save failed"));
    render(<NoteForm onSubmit={onSubmit} />);

    typeAndSubmit("Buy milk");

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("note-form-input")).toHaveValue("Buy milk");
  });

  it("labels the input for accessibility", () => {
    render(<NoteForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Note")).toBe(screen.getByTestId("note-form-input"));
  });
});
