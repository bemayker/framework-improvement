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
    type Saved = { id: number; text: string };

    // A promise the test settles by hand, so the save stays pending.
    function deferredSave() {
      let resolve!: (note: Saved) => void;
      let reject!: (reason: Error) => void;
      const promise = new Promise<Saved>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    }

    it("sends one request when the button is clicked twice", async () => {
      const save = deferredSave();
      createNoteMock.mockReturnValue(save.promise);
      const onCreated = vi.fn();
      render(<NoteForm onCreated={onCreated} />);

      typeNote("Buy milk");
      submitForm();
      submitForm();
      save.resolve({ id: 1, text: "Buy milk" });

      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
      expect(createNoteMock).toHaveBeenCalledTimes(1);
    });

    it("sends one request when the form is submitted twice before it re-renders", async () => {
      const save = deferredSave();
      createNoteMock.mockReturnValue(save.promise);
      const onCreated = vi.fn();
      render(<NoteForm onCreated={onCreated} />);

      typeNote("Buy milk");
      const form = screen.getByTestId("note-form");
      fireEvent.submit(form);
      fireEvent.submit(form);
      save.resolve({ id: 1, text: "Buy milk" });

      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
      expect(createNoteMock).toHaveBeenCalledTimes(1);
    });

    it("disables the button while pending and enables it after the save succeeds", async () => {
      const save = deferredSave();
      createNoteMock.mockReturnValue(save.promise);
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      submitForm();

      const button = screen.getByTestId("note-submit");
      await waitFor(() => expect(button).toBeDisabled());
      expect(button).toHaveAttribute("aria-busy", "true");

      save.resolve({ id: 1, text: "Buy milk" });
      await waitFor(() => expect(button).toBeEnabled());
      expect(button).toHaveAttribute("aria-busy", "false");
    });

    it("accepts the next note after a save finishes", async () => {
      createNoteMock
        .mockResolvedValueOnce({ id: 1, text: "First" })
        .mockResolvedValueOnce({ id: 2, text: "Second" });
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("First");
      submitForm();
      await waitFor(() => expect(screen.getByTestId("note-input")).toHaveValue(""));

      typeNote("Second");
      submitForm();

      await waitFor(() => expect(createNoteMock).toHaveBeenCalledTimes(2));
      expect(createNoteMock).toHaveBeenLastCalledWith("Second");
    });

    it("re-enables the button after a failed save and lets the kept text be retried", async () => {
      createNoteMock
        .mockRejectedValueOnce(new Error("Saving the note failed: 500"))
        .mockResolvedValueOnce({ id: 3, text: "Buy milk" });
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      submitForm();

      expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
      expect(screen.getByTestId("note-submit")).toBeEnabled();
      expect(screen.getByTestId("note-input")).toHaveValue("Buy milk");

      submitForm();

      await waitFor(() => expect(createNoteMock).toHaveBeenCalledTimes(2));
    });

    it("does not disable the button after an empty submit", async () => {
      render(<NoteForm onCreated={vi.fn()} />);

      submitForm();

      expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
      expect(screen.getByTestId("note-submit")).toBeEnabled();
    });
  });
});
