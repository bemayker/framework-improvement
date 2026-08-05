import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listNotes, createNote } from "./notes";

// The component tests mock this module wholesale, so nothing executed the
// client itself. Here `fetch` is stubbed instead of the module, so the real
// listNotes/createNote bodies run, including their non-OK throw branches.
const DEFAULT_NOTES_URL = "http://localhost:8000/api/notes";

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  } as Response;
}

function failedResponse(status: number, statusText: string): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({}),
  } as Response;
}

const fetchMock = vi.fn<typeof fetch>();

describe("notes API client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe("listNotes", () => {
    it("returns the notes the backend sent, from the default base URL", async () => {
      const notes = [
        { id: 1, text: "Buy milk" },
        { id: 2, text: "Walk dog" },
      ];
      fetchMock.mockResolvedValue(okResponse(notes));

      await expect(listNotes()).resolves.toEqual(notes);

      // With VITE_API_BASE_URL unset, the client falls back to :8000.
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(DEFAULT_NOTES_URL);
    });

    it("returns an empty array when no notes are stored", async () => {
      fetchMock.mockResolvedValue(okResponse([]));

      await expect(listNotes()).resolves.toEqual([]);
    });

    it("throws with the status and reason when the response is not OK", async () => {
      fetchMock.mockResolvedValue(failedResponse(500, "Internal Server Error"));

      await expect(listNotes()).rejects.toThrow(
        "Loading notes failed: 500 Internal Server Error",
      );
    });
  });

  describe("createNote", () => {
    it("posts the note as JSON and returns it with the assigned id", async () => {
      const savedNote = { id: 7, text: "Buy milk" };
      fetchMock.mockResolvedValue(okResponse(savedNote));

      await expect(createNote("Buy milk")).resolves.toEqual(savedNote);

      expect(fetchMock).toHaveBeenCalledWith(DEFAULT_NOTES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Buy milk" }),
      });
    });

    it("throws with the status and reason when the response is not OK", async () => {
      fetchMock.mockResolvedValue(failedResponse(422, "Unprocessable Entity"));

      await expect(createNote("")).rejects.toThrow(
        "Saving the note failed: 422 Unprocessable Entity",
      );
    });
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { listNotes: listNotesWithConfiguredBase } = await import("./notes");
    fetchMock.mockResolvedValue(okResponse([]));

    await listNotesWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/notes");
  });
});
