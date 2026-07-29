import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, createEvent, waitFor } from "@testing-library/react";
import Notes from "./Notes";
import { createNote, listNotes } from "../api/notesClient";
import type { Note } from "../api/notesClient";

vi.mock("../api/notesClient", () => ({
  listNotes: vi.fn(),
  createNote: vi.fn(),
}));

const listNotesMock = vi.mocked(listNotes);
const createNoteMock = vi.mocked(createNote);

function note(id: number, text: string): Note {
  return { id, text, createdAt: "2026-07-28T09:15:00+00:00" };
}

/** Renders the component and waits for the initial load to settle. */
async function renderNotes() {
  render(<Notes />);
  await screen.findByTestId("note-list");
}

function typeNote(text: string) {
  fireEvent.change(screen.getByTestId("note-input"), { target: { value: text } });
}

function submitForm() {
  fireEvent.click(screen.getByTestId("note-submit"));
}

describe("Notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listNotesMock.mockResolvedValue([]);
  });

  it("renders the notes fetched on mount, oldest first", async () => {
    listNotesMock.mockResolvedValue([note(1, "Buy milk"), note(2, "Walk the dog")]);

    await renderNotes();

    expect(await screen.findByTestId("note-item-1")).toHaveTextContent("Buy milk");
    expect(screen.getByTestId("note-item-2")).toHaveTextContent("Walk the dog");
    expect(listNotesMock).toHaveBeenCalledTimes(1);
  });

  it("submitting a non-empty note stores it and appends it to the list", async () => {
    createNoteMock.mockResolvedValue(note(7, "Buy milk"));

    await renderNotes();
    typeNote("Buy milk");
    submitForm();

    expect(await screen.findByTestId("note-item-7")).toHaveTextContent("Buy milk");
    expect(createNoteMock).toHaveBeenCalledWith("Buy milk");
    expect(screen.getByTestId("note-input")).toHaveValue("");
  });

  it("submitting trims surrounding whitespace before storing the note", async () => {
    createNoteMock.mockResolvedValue(note(8, "Buy milk"));

    await renderNotes();
    typeNote("  Buy milk  ");
    submitForm();

    expect(await screen.findByTestId("note-item-8")).toBeInTheDocument();
    expect(createNoteMock).toHaveBeenCalledWith("Buy milk");
  });

  it("prevents the form's default submission so the page never reloads", async () => {
    createNoteMock.mockResolvedValue(note(9, "Buy milk"));

    await renderNotes();
    typeNote("Buy milk");
    const form = screen.getByTestId("note-form");
    const submitEvent = createEvent.submit(form);
    fireEvent(form, submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(await screen.findByTestId("note-item-9")).toBeInTheDocument();
  });

  it("submitting an empty note shows a validation message and calls no API", async () => {
    await renderNotes();
    submitForm();

    expect(screen.getByTestId("note-validation-error")).toHaveTextContent(
      "Please enter a note before submitting.",
    );
    expect(createNoteMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("note-list").children).toHaveLength(0);
  });

  it("submitting a whitespace-only note shows a validation message and calls no API", async () => {
    await renderNotes();
    typeNote("   ");
    submitForm();

    expect(screen.getByTestId("note-validation-error")).toBeInTheDocument();
    expect(createNoteMock).not.toHaveBeenCalled();
  });

  it("clears the validation message once the user types a note", async () => {
    await renderNotes();
    submitForm();
    expect(screen.getByTestId("note-validation-error")).toBeInTheDocument();

    typeNote("Buy milk");

    expect(screen.queryByTestId("note-validation-error")).not.toBeInTheDocument();
  });

  it("shows an error message when the initial load fails", async () => {
    listNotesMock.mockRejectedValue(new Error("network down"));

    render(<Notes />);

    expect(await screen.findByTestId("notes-error")).toHaveTextContent(
      "Could not load your notes. Please try again.",
    );
  });

  it("shows an error message when storing a note fails", async () => {
    createNoteMock.mockRejectedValue(new Error("network down"));

    await renderNotes();
    typeNote("Buy milk");
    submitForm();

    expect(await screen.findByTestId("notes-error")).toHaveTextContent(
      "Could not save your note. Please try again.",
    );
    await waitFor(() => expect(screen.getByTestId("note-list").children).toHaveLength(0));
  });

  it("labels the input and links the validation message to it for accessibility", async () => {
    await renderNotes();

    const input = screen.getByLabelText("Note text");
    expect(input).toHaveAttribute("data-testid", "note-input");
    expect(input).toHaveAttribute("aria-invalid", "false");

    submitForm();

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      screen.getByTestId("note-validation-error").id,
    );
  });
});
