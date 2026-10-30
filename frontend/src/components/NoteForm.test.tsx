import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NoteForm from "./NoteForm";
import { createNote, type Note } from "../api/notes";

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

// A save whose settlement the test controls, so the in-flight window is deterministic.
function deferredSave() {
  let resolve!: (note: Note) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Note>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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

  it("submits only once when the form is submitted twice before the save resolves", async () => {
    const pending = deferredSave();
    createNoteMock.mockReturnValue(pending.promise);
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    submitForm();
    submitForm();

    expect(createNoteMock).toHaveBeenCalledTimes(1);

    pending.resolve({ id: 10, text: "Buy milk" });
    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
  });

  // Submit events bypass the disabled button, so this is what proves the
  // synchronous in-flight guard rather than the disabled attribute.
  it("ignores a second submit event dispatched on the form while the save is pending", async () => {
    const pending = deferredSave();
    createNoteMock.mockReturnValue(pending.promise);
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    const form = screen.getByTestId("note-form");
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(createNoteMock).toHaveBeenCalledTimes(1);

    pending.resolve({ id: 14, text: "Buy milk" });
    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
  });

  it("disables the submit button while the save is pending and enables it after it resolves", async () => {
    const pending = deferredSave();
    createNoteMock.mockReturnValue(pending.promise);
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    submitForm();

    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeDisabled());

    pending.resolve({ id: 11, text: "Buy milk" });

    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
  });

  it("re-enables the button, keeps the text and shows the error when the save is rejected", async () => {
    const pending = deferredSave();
    createNoteMock.mockReturnValue(pending.promise);
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    submitForm();
    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeDisabled());

    pending.reject(new Error("Saving the note failed: 500"));

    expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
    expect(screen.getByTestId("note-submit")).toBeEnabled();
    expect(screen.getByTestId("note-input")).toHaveValue("Buy milk");
  });

  it("accepts a new save once the first one has completed", async () => {
    createNoteMock
      .mockResolvedValueOnce({ id: 12, text: "First" })
      .mockResolvedValueOnce({ id: 13, text: "Second" });
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("First");
    submitForm();
    await waitFor(() => expect(screen.getByTestId("note-input")).toHaveValue(""));
    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());

    typeNote("Second");
    submitForm();

    await waitFor(() => expect(createNoteMock).toHaveBeenCalledTimes(2));
    expect(createNoteMock).toHaveBeenLastCalledWith("Second");
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
