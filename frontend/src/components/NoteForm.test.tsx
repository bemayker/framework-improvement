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

  describe("while a save is in flight", () => {
    // Holds the mocked createNote open so the in-flight window is deterministic.
    function holdNextSave() {
      let resolve!: (note: Note) => void;
      let reject!: (reason: Error) => void;
      const pending = new Promise<Note>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      createNoteMock.mockReturnValueOnce(pending);
      return { resolve, reject };
    }

    it("calls createNote once when the form is submitted twice before the first save answers", async () => {
      const save = holdNextSave();
      const onCreated = vi.fn();
      render(<NoteForm onCreated={onCreated} />);

      typeNote("Buy milk");
      fireEvent.submit(screen.getByTestId("note-form"));
      fireEvent.submit(screen.getByTestId("note-form"));

      expect(createNoteMock).toHaveBeenCalledTimes(1);

      save.resolve({ id: 1, text: "Buy milk" });
      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
      expect(createNoteMock).toHaveBeenCalledTimes(1);
    });

    it("disables the save button while pending and enables it again after the save succeeds", async () => {
      const save = holdNextSave();
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      submitForm();

      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeDisabled());

      save.resolve({ id: 2, text: "Buy milk" });

      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
    });

    it("enables the button again after a failed save and lets a retry call createNote a second time", async () => {
      const failing = holdNextSave();
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      submitForm();
      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeDisabled());

      failing.reject(new Error("Saving the note failed: 500"));
      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
      expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();

      createNoteMock.mockResolvedValueOnce({ id: 3, text: "Buy milk" });
      submitForm();

      await waitFor(() => expect(createNoteMock).toHaveBeenCalledTimes(2));
    });

    it("saves the same text again on purpose after the first save has settled", async () => {
      createNoteMock.mockResolvedValue({ id: 4, text: "Buy milk" });
      const onCreated = vi.fn();
      render(<NoteForm onCreated={onCreated} />);

      typeNote("Buy milk");
      submitForm();
      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));

      typeNote("Buy milk");
      submitForm();

      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(2));
      expect(createNoteMock).toHaveBeenCalledTimes(2);
    });

    it("never disables the button for an empty submit", async () => {
      render(<NoteForm onCreated={vi.fn()} />);

      submitForm();

      expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
      expect(screen.getByTestId("note-submit")).toBeEnabled();
      expect(createNoteMock).not.toHaveBeenCalled();
    });
  });
});
