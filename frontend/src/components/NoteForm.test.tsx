import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NoteForm from "./NoteForm";
import { createNote } from "../api/notes";

vi.mock("../api/notes", () => ({
  createNote: vi.fn(),
}));

const createNoteMock = vi.mocked(createNote);

function submitForm() {
  fireEvent.click(screen.getByTestId("note-submit"));
}

function typeNote(text: string) {
  fireEvent.change(screen.getByTestId("note-input"), { target: { value: text } });
}

describe("NoteForm", () => {
  beforeEach(() => {
    createNoteMock.mockReset();
  });

  it("shows a validation message and makes no API call when the note is empty", async () => {
    render(<NoteForm onCreated={vi.fn()} />);

    submitForm();

    expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
    expect(createNoteMock).not.toHaveBeenCalled();
  });

  it("treats a whitespace-only note as empty and makes no API call", async () => {
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("   ");
    submitForm();

    expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
    expect(createNoteMock).not.toHaveBeenCalled();
  });

  it("saves a non-empty note, clears the input, and reports the stored note", async () => {
    const savedNote = { id: 7, text: "Buy milk" };
    createNoteMock.mockResolvedValue(savedNote);
    const onCreated = vi.fn();
    render(<NoteForm onCreated={onCreated} />);

    typeNote("Buy milk");
    submitForm();

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(savedNote));
    expect(createNoteMock).toHaveBeenCalledWith("Buy milk");
    expect(screen.getByTestId("note-input")).toHaveValue("");
    expect(screen.queryByTestId("note-form-error")).not.toBeInTheDocument();
  });

  it("trims surrounding whitespace before saving", async () => {
    createNoteMock.mockResolvedValue({ id: 8, text: "Walk dog" });
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("  Walk dog  ");
    submitForm();

    await waitFor(() => expect(createNoteMock).toHaveBeenCalledWith("Walk dog"));
  });

  it("shows an error message and keeps the text when saving fails", async () => {
    createNoteMock.mockRejectedValue(new Error("Saving the note failed: 500"));
    const onCreated = vi.fn();
    render(<NoteForm onCreated={onCreated} />);

    typeNote("Buy milk");
    submitForm();

    expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
    expect(screen.getByTestId("note-input")).toHaveValue("Buy milk");
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("clears a previous validation message once a valid note is saved", async () => {
    createNoteMock.mockResolvedValue({ id: 9, text: "Buy milk" });
    render(<NoteForm onCreated={vi.fn()} />);

    submitForm();
    expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();

    typeNote("Buy milk");
    submitForm();

    await waitFor(() =>
      expect(screen.queryByTestId("note-form-error")).not.toBeInTheDocument(),
    );
  });
});
