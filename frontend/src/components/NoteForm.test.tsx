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

// A promise the test settles by hand, so "the first save is still in flight"
// is a deterministic moment rather than a timing race.
function deferredNote() {
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

  it("sends one request when Save note is clicked twice before the first save finishes", async () => {
    const pending = deferredNote();
    createNoteMock.mockReturnValue(pending.promise);
    const onCreated = vi.fn();
    render(<NoteForm onCreated={onCreated} />);

    typeNote("Buy milk");
    submitForm();
    submitForm();

    expect(createNoteMock).toHaveBeenCalledTimes(1);

    pending.resolve({ id: 1, text: "Buy milk" });
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(createNoteMock).toHaveBeenCalledTimes(1);
  });

  it("sends one request when the form is submitted twice before the first save finishes", async () => {
    // fireEvent.submit bypasses the disabled button, so this pins the ref guard.
    const pending = deferredNote();
    createNoteMock.mockReturnValue(pending.promise);
    const onCreated = vi.fn();
    render(<NoteForm onCreated={onCreated} />);

    typeNote("Buy milk");
    fireEvent.submit(screen.getByTestId("note-form"));
    fireEvent.submit(screen.getByTestId("note-form"));

    expect(createNoteMock).toHaveBeenCalledTimes(1);

    pending.resolve({ id: 1, text: "Buy milk" });
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  });

  it("disables the Save note button while the save is in flight and re-enables it afterwards", async () => {
    const pending = deferredNote();
    createNoteMock.mockReturnValue(pending.promise);
    render(<NoteForm onCreated={vi.fn()} />);

    expect(screen.getByTestId("note-submit")).toBeEnabled();

    typeNote("Buy milk");
    submitForm();

    expect(screen.getByTestId("note-submit")).toBeDisabled();

    pending.resolve({ id: 1, text: "Buy milk" });
    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
  });

  it("allows saving again after a failed save", async () => {
    const first = deferredNote();
    createNoteMock
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ id: 2, text: "Buy milk" });
    const onCreated = vi.fn();
    render(<NoteForm onCreated={onCreated} />);

    typeNote("Buy milk");
    submitForm();
    first.reject(new Error("Saving the note failed: 500"));
    expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());

    submitForm();

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(createNoteMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("note-form-error")).not.toBeInTheDocument();
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
