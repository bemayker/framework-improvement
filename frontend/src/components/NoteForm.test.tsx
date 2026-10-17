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

  it("sends only one create request on a double submit while the first save is pending", () => {
    // A promise that never settles keeps the first save in flight for the whole test.
    createNoteMock.mockReturnValue(new Promise(() => {}));
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    submitForm();
    submitForm();

    expect(createNoteMock).toHaveBeenCalledTimes(1);
  });

  it("ignores a second submit event while the first save is pending, even with the button not yet disabled", () => {
    // Submit events bypass the button's disabled attribute, so only the in-flight
    // guard inside the handler can stop the second one.
    createNoteMock.mockReturnValue(new Promise(() => {}));
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    const form = screen.getByTestId("note-form");
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(createNoteMock).toHaveBeenCalledTimes(1);
  });

  it("disables the submit button while saving and enables it again once the save succeeds", async () => {
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

    resolveSave({ id: 10, text: "Buy milk" });

    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());
    expect(screen.getByTestId("note-input")).toHaveValue("");
  });

  it("releases the guard after a failed save so a retry sends exactly one more request", async () => {
    createNoteMock.mockRejectedValueOnce(new Error("Saving the note failed: 500"));
    createNoteMock.mockResolvedValue({ id: 11, text: "Buy milk" });
    render(<NoteForm onCreated={vi.fn()} />);

    typeNote("Buy milk");
    submitForm();

    expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("note-submit")).toBeEnabled());

    submitForm();

    await waitFor(() => expect(createNoteMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByTestId("note-form-error")).not.toBeInTheDocument(),
    );
  });

  it("keeps the submit button enabled after an empty submit while idle", async () => {
    render(<NoteForm onCreated={vi.fn()} />);

    submitForm();

    expect(await screen.findByTestId("note-form-error")).toBeInTheDocument();
    expect(screen.getByTestId("note-submit")).toBeEnabled();
  });
});
