import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NoteForm from "./NoteForm";

function typeAndSubmit(value: string) {
  fireEvent.change(screen.getByTestId("note-input"), { target: { value } });
  fireEvent.click(screen.getByTestId("note-submit"));
}

describe("NoteForm", () => {
  it("submits the trimmed text once and clears the input", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<NoteForm onSubmit={onSubmit} />);

    typeAndSubmit("  Buy milk  ");

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Buy milk"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByTestId("note-input")).toHaveValue(""));
    expect(screen.queryByTestId("note-error")).not.toBeInTheDocument();
  });

  it("shows a validation message and submits nothing when the input is empty", () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId("note-submit"));

    expect(screen.getByTestId("note-error")).toHaveTextContent("Note text is required");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a validation message and submits nothing when the input is only whitespace", () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<NoteForm onSubmit={onSubmit} />);

    typeAndSubmit("   ");

    expect(screen.getByTestId("note-error")).toHaveTextContent("Note text is required");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("marks the input invalid and describes it by the error message when validation fails", () => {
    render(<NoteForm onSubmit={vi.fn().mockResolvedValue(true)} />);

    fireEvent.click(screen.getByTestId("note-submit"));

    const input = screen.getByTestId("note-input");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Note text is required");
  });

  it("keeps the typed text when the submit handler reports a failure", async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<NoteForm onSubmit={onSubmit} />);

    typeAndSubmit("Call the dentist");

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByTestId("note-input")).toHaveValue("Call the dentist"),
    );
  });

  it("renders a submit error reported by the caller", () => {
    render(<NoteForm onSubmit={vi.fn().mockResolvedValue(true)} submitError="Server unavailable" />);

    expect(screen.getByTestId("note-error")).toHaveTextContent("Server unavailable");
  });
});
