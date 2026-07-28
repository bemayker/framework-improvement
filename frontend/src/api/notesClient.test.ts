import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createNote, listNotes, NotesApiError } from "./notesClient";

/**
 * The client centralises the notes API's error handling, so its non-happy paths
 * are exactly what needs covering here: the component tests mock this module
 * wholesale and the E2E specs only drive the happy path.
 *
 * `fetch` is stubbed rather than the module, so the real validation, mapping and
 * error translation run.
 */

const NOTES_PATH_PATTERN = /\/api\/notes$/;

const fetchMock = vi.fn();

/** A response whose body parses, standing in for what the backend returns. */
function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

/** A response whose body is not JSON (an HTML error page from a proxy, say). */
function unreadableResponse(status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new SyntaxError("Unexpected token < in JSON at position 0");
    },
  };
}

/** Runs `action`, asserting it rejects with a NotesApiError, and returns it. */
async function captureNotesApiError(action: () => Promise<unknown>): Promise<NotesApiError> {
  try {
    await action();
  } catch (error) {
    if (error instanceof NotesApiError) {
      return error;
    }
    throw error;
  }
  throw new Error("Expected the notes client to reject with a NotesApiError.");
}

function requestOf(callIndex: number): [string, RequestInit | undefined] {
  return fetchMock.mock.calls[callIndex] as [string, RequestInit | undefined];
}

describe("notesClient", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("createNote", () => {
    it("posts the note and maps the stored created_at to createdAt", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ id: 7, text: "Buy milk", created_at: "2026-07-28T09:15:00+00:00" }, 201),
      );

      const note = await createNote("Buy milk");

      expect(note).toEqual({ id: 7, text: "Buy milk", createdAt: "2026-07-28T09:15:00+00:00" });
      const [url, init] = requestOf(0);
      expect(url).toMatch(NOTES_PATH_PATTERN);
      expect(init?.method).toBe("POST");
      expect(init?.headers).toEqual({ "Content-Type": "application/json" });
      expect(init?.body).toBe(JSON.stringify({ text: "Buy milk" }));
    });

    it("rejects with the backend's detail message when the response is not 2xx", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ detail: "Note text must not be empty." }, 422),
      );

      const error = await captureNotesApiError(() => createNote(""));

      expect(error.message).toBe("Note text must not be empty.");
      expect(error.status).toBe(422);
    });

    it("rejects with a status-based message when a failed response has no readable body", async () => {
      fetchMock.mockResolvedValue(unreadableResponse(502));

      const error = await captureNotesApiError(() => createNote("Buy milk"));

      expect(error.message).toBe("The notes API responded with status 502.");
      expect(error.status).toBe(502);
    });

    it("rejects when a successful response does not carry a note", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ id: 7, text: "Buy milk" }, 201));

      const error = await captureNotesApiError(() => createNote("Buy milk"));

      expect(error.message).toBe("The notes API returned an unexpected note.");
    });
  });

  describe("listNotes", () => {
    it("returns every note from the API, mapped to the client's shape", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          { id: 1, text: "Buy milk", created_at: "2026-07-28T09:15:00+00:00" },
          { id: 2, text: "Walk the dog", created_at: "2026-07-28T09:16:30+00:00" },
        ]),
      );

      const notes = await listNotes();

      expect(notes).toEqual([
        { id: 1, text: "Buy milk", createdAt: "2026-07-28T09:15:00+00:00" },
        { id: 2, text: "Walk the dog", createdAt: "2026-07-28T09:16:30+00:00" },
      ]);
      const [url, init] = requestOf(0);
      expect(url).toMatch(NOTES_PATH_PATTERN);
      expect(init).toBeUndefined();
    });

    it("returns an empty list when no notes are stored", async () => {
      fetchMock.mockResolvedValue(jsonResponse([]));

      await expect(listNotes()).resolves.toEqual([]);
    });

    it("rejects when any element of the list is not a note", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse([
          { id: 1, text: "Buy milk", created_at: "2026-07-28T09:15:00+00:00" },
          { id: 2, text: "Walk the dog" },
        ]),
      );

      const error = await captureNotesApiError(listNotes);

      expect(error.message).toBe("The notes API returned an unexpected note list.");
    });

    it("rejects when the API returns something that is not a list", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ notes: [] }));

      const error = await captureNotesApiError(listNotes);

      expect(error.message).toBe("The notes API returned an unexpected note list.");
    });

    it("rejects with a reachability message when the request itself fails", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

      const error = await captureNotesApiError(listNotes);

      expect(error.message).toMatch(/^Could not reach the notes API at /);
      expect(error.status).toBeUndefined();
    });

    it("rejects when a successful response carries an unreadable body", async () => {
      fetchMock.mockResolvedValue(unreadableResponse(200));

      const error = await captureNotesApiError(listNotes);

      expect(error.message).toBe("The notes API returned an unreadable response.");
      expect(error.status).toBe(200);
    });
  });
});
