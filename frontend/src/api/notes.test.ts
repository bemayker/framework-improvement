import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NotesApiError, createNote, fetchNotes, type Note } from "./notes";

const NOTES_URL = "http://localhost:8000/api/notes";

const savedNote: Note = { id: 1, content: "Buy milk", created_at: "2026-07-30T12:00:00Z" };

/**
 * A hand-built stand-in rather than the platform `Response`: these tests are
 * about the branches this module takes on what it gets back, including a body
 * that fails to parse, which a real `Response` cannot easily be made to do.
 */
function stubResponse(options: {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}): Response {
  return options as unknown as Response;
}

function jsonResponse(body: unknown, status = 200): Response {
  return stubResponse({ ok: status >= 200 && status < 300, status, json: async () => body });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function initOfLastCall(): RequestInit | undefined {
  return fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
}

describe("fetchNotes", () => {
  it("returns the note list from a successful response", async () => {
    fetchMock.mockResolvedValue(jsonResponse([savedNote]));

    await expect(fetchNotes()).resolves.toEqual([savedNote]);
    expect(fetchMock).toHaveBeenCalledWith(NOTES_URL, expect.anything());
  });

  it("sends no Content-Type header, because the request has no body", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await fetchNotes();

    expect(initOfLastCall()?.headers).toBeUndefined();
  });

  it("throws a NotesApiError with no status when the API cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await fetchNotes().catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(NotesApiError);
    expect((error as NotesApiError).status).toBeNull();
  });

  it("throws a NotesApiError carrying the status when the response is not ok", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "boom" }, 500));

    const error = await fetchNotes().catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(NotesApiError);
    expect((error as NotesApiError).status).toBe(500);
  });

  it("throws a NotesApiError when the response body is not valid JSON", async () => {
    fetchMock.mockResolvedValue(
      stubResponse({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError("Unexpected token <")),
      }),
    );

    await expect(fetchNotes()).rejects.toBeInstanceOf(NotesApiError);
  });

  it("throws a NotesApiError when the payload is not an array", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ notes: [savedNote] }));

    await expect(fetchNotes()).rejects.toBeInstanceOf(NotesApiError);
  });
});

describe("createNote", () => {
  it("posts the content as JSON and returns the created note", async () => {
    fetchMock.mockResolvedValue(jsonResponse(savedNote, 201));

    await expect(createNote("Buy milk")).resolves.toEqual(savedNote);

    const init = initOfLastCall();
    expect(fetchMock).toHaveBeenCalledWith(NOTES_URL, expect.anything());
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ content: "Buy milk" }));
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("throws a NotesApiError carrying the status when the note is rejected", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "invalid" }, 422));

    const error = await createNote("").catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(NotesApiError);
    expect((error as NotesApiError).status).toBe(422);
  });
});
