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
    it("double click while saving calls createNote once", async () => {
      let resolveSave: (note: { id: number; text: string }) => void = () => {};
      createNoteMock.mockReturnValue(
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
      );
      const onCreated = vi.fn();
      render(<NoteForm onCreated={onCreated} />);

      typeNote("Buy milk");
      submitForm();
      submitForm();
      // A submit event dispatched before React re-renders the disabled button.
      fireEvent.submit(screen.getByTestId("note-form"));

      expect(createNoteMock).toHaveBeenCalledTimes(1);

      resolveSave({ id: 1, text: "Buy milk" });
      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
      expect(createNoteMock).toHaveBeenCalledTimes(1);
    });

    it("disables the submit button while saving and re-enables it afterwards", async () => {
      let resolveSave: (note: { id: number; text: string }) => void = () => {};
      createNoteMock.mockReturnValue(
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
      );
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      submitForm();

      expect(screen.getByTestId("note-submit")).toBeDisabled();

      resolveSave({ id: 2, text: "Buy milk" });
      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
      expect(screen.getByTestId("note-input")).toHaveValue("");
    });

    it("re-enables the button and sends a retry after a failed save", async () => {
      let rejectSave: (reason: Error) => void = () => {};
      createNoteMock.mockReturnValueOnce(
        new Promise((_resolve, reject) => {
          rejectSave = reject;
        }),
      );
      render(<NoteForm onCreated={vi.fn()} />);

      typeNote("Buy milk");
      submitForm();
      rejectSave(new Error("Saving the note failed: 500"));

      expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
      expect(screen.getByTestId("note-input")).toHaveValue("Buy milk");
      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());

      createNoteMock.mockResolvedValueOnce({ id: 3, text: "Buy milk" });
      submitForm();

      await waitFor(() => expect(createNoteMock).toHaveBeenCalledTimes(2));
    });

    it("sends a deliberate second save of the same text after the first finishes", async () => {
      createNoteMock
        .mockResolvedValueOnce({ id: 4, text: "Buy milk" })
        .mockResolvedValueOnce({ id: 5, text: "Buy milk" });
      const onCreated = vi.fn();
      render(<NoteForm onCreated={onCreated} />);

      typeNote("Buy milk");
      submitForm();
      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());

      typeNote("Buy milk");
      submitForm();

      await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(2));
      expect(createNoteMock).toHaveBeenCalledTimes(2);
    });
  });
});
