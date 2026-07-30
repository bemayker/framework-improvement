import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NoteForm from "./NoteForm";

function typeNote(text: string) {
  fireEvent.change(screen.getByTestId("note-input"), { target: { value: text } });
}

describe("NoteForm", () => {
  it("submits the trimmed content and clears the input", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteForm onSubmit={onSubmit} />);

    typeNote("  Buy milk  ");
    fireEvent.click(screen.getByTestId("note-submit"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Buy milk"));
    expect(screen.getByTestId("note-input")).toHaveValue("");
    expect(screen.queryByTestId("note-validation-error")).not.toBeInTheDocument();
  });

  it("rejects an empty note with a visible message and calls no API", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId("note-submit"));

    expect(await screen.findByTestId("note-validation-error")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only note with a visible message and calls no API", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteForm onSubmit={onSubmit} />);

    typeNote("   ");
    fireEvent.click(screen.getByTestId("note-submit"));

    expect(await screen.findByTestId("note-validation-error")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps the typed note and reports a save failure under its own test id", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("api down"));
    render(<NoteForm onSubmit={onSubmit} />);

    typeNote("Walk the dog");
    fireEvent.click(screen.getByTestId("note-submit"));

    expect(await screen.findByTestId("note-save-error")).toBeVisible();
    // A failed save is not a rejected input: the two must not share a test id.
    expect(screen.queryByTestId("note-validation-error")).not.toBeInTheDocument();
    expect(screen.getByTestId("note-input")).toHaveValue("Walk the dog");
  });

  it("reports a rejected input without raising the save-failure message", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId("note-submit"));

    expect(await screen.findByTestId("note-validation-error")).toBeVisible();
    expect(screen.queryByTestId("note-save-error")).not.toBeInTheDocument();
  });

  it("clears a previous validation message once a valid note is submitted", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId("note-submit"));
    expect(await screen.findByTestId("note-validation-error")).toBeVisible();

    typeNote("Buy milk");
    fireEvent.click(screen.getByTestId("note-submit"));

    await waitFor(() =>
      expect(screen.queryByTestId("note-validation-error")).not.toBeInTheDocument(),
    );
  });
});
