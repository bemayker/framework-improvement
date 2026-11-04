import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NoteForm from "./NoteForm";
import { createNote, type Note } from "../api/notes";

vi.mock("../api/notes", () => ({
  createNote: vi.fn(),
}));

const createNoteMock = vi.mocked(createNote);

// A promise the test settles by hand, so a save can stay pending while it acts.
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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

  it("sends one request when submitted twice before the first save resolves", async () => {
    const pending = deferred<Note>();
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

  it("disables the submit button while saving and enables it again after success", async () => {
    const pending = deferred<Note>();
    createNoteMock.mockReturnValue(pending.promise);
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    submitForm();

    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeDisabled());

    pending.resolve({ id: 2, text: "Buy milk" });
    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
  });

  it("enables the button again after a failed save and lets the user retry", async () => {
    const pending = deferred<Note>();
    createNoteMock.mockReturnValueOnce(pending.promise);
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    submitForm();
    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeDisabled());

    pending.reject(new Error("Saving the note failed: 500"));
    expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
    expect(screen.getByTestId("note-submit")).toBeEnabled();
    expect(screen.getByTestId("note-input")).toHaveValue("Buy milk");

    createNoteMock.mockResolvedValueOnce({ id: 3, text: "Buy milk" });
    submitForm();
    await waitFor(() => expect(createNoteMock).toHaveBeenCalledTimes(2));
  });

  it("does not disable the button when the note is empty", async () => {
    render(<NoteForm onCreated={vi.fn()} />);

    submitForm();

    expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
    expect(screen.getByTestId("note-submit")).toBeEnabled();
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
