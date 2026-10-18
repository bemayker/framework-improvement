import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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

  it("sends one request for a second submit while the first save is pending", async () => {
    createNoteMock.mockReturnValue(new Promise<Note>(() => {}));
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    submitForm();
    submitForm();

    expect(createNoteMock).toHaveBeenCalledTimes(1);
  });

  it("sends one request for a form submit while the first save is pending", async () => {
    createNoteMock.mockReturnValue(new Promise<Note>(() => {}));
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    submitForm();
    fireEvent.submit(screen.getByTestId("note-form"));

    expect(createNoteMock).toHaveBeenCalledTimes(1);
  });

  it("disables the submit button while saving and enables it afterwards", async () => {
    let resolveSave: (note: Note) => void = () => {};
    createNoteMock.mockReturnValue(
      new Promise<Note>((resolve) => {
        resolveSave = resolve;
      }),
    );
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    submitForm();
    expect(screen.getByTestId("note-submit")).toBeDisabled();

    await act(async () => {
      resolveSave({ id: 1, text: "Buy milk" });
    });
    expect(screen.getByTestId("note-submit")).toBeEnabled();
  });

  it("re-enables the form and allows a retry after a failed save", async () => {
    let rejectSave: (reason: Error) => void = () => {};
    createNoteMock.mockReturnValueOnce(
      new Promise<Note>((_resolve, reject) => {
        rejectSave = reject;
      }),
    );
    createNoteMock.mockResolvedValueOnce({ id: 2, text: "Buy milk" });
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    submitForm();
    await act(async () => {
      rejectSave(new Error("boom"));
    });

    expect(screen.getByTestId("note-form-error")).toBeInTheDocument();
    expect(screen.getByTestId("note-submit")).toBeEnabled();

    submitForm();
    await waitFor(() => expect(createNoteMock).toHaveBeenCalledTimes(2));
  });

  it("accepts a new note after a successful save", async () => {
    createNoteMock.mockResolvedValueOnce({ id: 3, text: "First" });
    createNoteMock.mockResolvedValueOnce({ id: 4, text: "Second" });
    const onCreated = vi.fn();
    render(<NoteForm onCreated={onCreated} />);

    typeNote("First");
    submitForm();
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));

    typeNote("Second");
    submitForm();
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(2));
    expect(createNoteMock).toHaveBeenCalledTimes(2);
  });

  it("does not disable the submit button for an empty submit", async () => {
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
