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

  describe("while a save is in flight", () => {
    // A save the test settles by hand, so the pending window is deterministic.
    function holdSave() {
      let resolve!: (note: { id: number; text: string }) => void;
      let reject!: (reason: Error) => void;
      const pending = new Promise<{ id: number; text: string }>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      createNoteMock.mockReturnValue(pending);
      return { resolve, reject };
    }

    it("sends one request for a quick double click and disables the button", async () => {
      const save = holdSave();
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      submitForm();
      submitForm();

      expect(createNoteMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("note-submit")).toBeDisabled();
      expect(screen.getByTestId("note-form")).toHaveAttribute("aria-busy", "true");

      save.resolve({ id: 1, text: "Buy milk" });
      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
    });

    it("ignores an Enter submit while the save is pending", async () => {
      const save = holdSave();
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      submitForm();
      fireEvent.submit(screen.getByTestId("note-form"));
      fireEvent.submit(screen.getByTestId("note-form"));

      expect(createNoteMock).toHaveBeenCalledTimes(1);

      save.resolve({ id: 2, text: "Buy milk" });
      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
    });

    it("re-enables the button and clears the input after a successful save", async () => {
      const save = holdSave();
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      submitForm();
      save.resolve({ id: 3, text: "Buy milk" });

      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
      expect(screen.getByTestId("note-input")).toHaveValue("");
      expect(screen.getByTestId("note-form")).toHaveAttribute("aria-busy", "false");

      createNoteMock.mockResolvedValue({ id: 4, text: "Second" });
      typeNote("Second");
      submitForm();
      await waitFor(() => expect(createNoteMock).toHaveBeenCalledTimes(2));
    });

    it("re-enables the button, keeps the text and shows the error after a failed save", async () => {
      const save = holdSave();
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      submitForm();
      save.reject(new Error("Saving the note failed: 500"));

      expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
      expect(screen.getByTestId("note-submit")).toBeEnabled();
      expect(screen.getByTestId("note-input")).toHaveValue("Buy milk");
    });

    it("never disables the button for an empty note", () => {
      render(<NoteForm onCreated={vi.fn()} />);

      submitForm();

      expect(screen.getByTestId("note-submit")).toBeEnabled();
    });
  });
});
