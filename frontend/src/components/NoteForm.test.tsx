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
    type Deferred = {
      promise: Promise<{ id: number; text: string }>;
      resolve: (note: { id: number; text: string }) => void;
      reject: (reason: Error) => void;
    };

    function deferredSave(): Deferred {
      let resolve!: Deferred["resolve"];
      let reject!: Deferred["reject"];
      const promise = new Promise<{ id: number; text: string }>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    }

    it("sends one request when the form is submitted twice before the first save settles", async () => {
      const save = deferredSave();
      createNoteMock.mockReturnValue(save.promise);
      const onCreated = vi.fn();
      render(<NoteForm onCreated={onCreated} />);

      typeNote("Buy milk");
      fireEvent.click(screen.getByTestId("note-submit"));
      fireEvent.click(screen.getByTestId("note-submit"));

      expect(createNoteMock).toHaveBeenCalledTimes(1);

      save.resolve({ id: 1, text: "Buy milk" });
      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    });

    it("sends one request when the form element is submitted twice (Enter key path)", async () => {
      const save = deferredSave();
      createNoteMock.mockReturnValue(save.promise);
      const onCreated = vi.fn();
      render(<NoteForm onCreated={onCreated} />);

      typeNote("Buy milk");
      fireEvent.submit(screen.getByTestId("note-form"));
      fireEvent.submit(screen.getByTestId("note-form"));

      expect(createNoteMock).toHaveBeenCalledTimes(1);

      save.resolve({ id: 1, text: "Buy milk" });
      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    });

    it("disables the button while pending and enables it again after success", async () => {
      const save = deferredSave();
      createNoteMock.mockReturnValue(save.promise);
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      expect(screen.getByTestId("note-submit")).toBeEnabled();
      submitForm();

      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeDisabled());

      save.resolve({ id: 1, text: "Buy milk" });

      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
    });

    it("re-enables the button, keeps the text and allows a retry after a failed save", async () => {
      const save = deferredSave();
      createNoteMock.mockReturnValueOnce(save.promise);
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      submitForm();
      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeDisabled());

      save.reject(new Error("Saving the note failed: 500"));

      expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
      expect(screen.getByTestId("note-submit")).toBeEnabled();
      expect(screen.getByTestId("note-input")).toHaveValue("Buy milk");

      createNoteMock.mockResolvedValueOnce({ id: 2, text: "Buy milk" });
      submitForm();

      await waitFor(() => expect(createNoteMock).toHaveBeenCalledTimes(2));
    });
  });
});
