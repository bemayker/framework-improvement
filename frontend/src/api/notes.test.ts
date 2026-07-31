import { describe, it, expect, vi, afterEach } from "vitest";
import { ApiError, createNote, listNotes } from "./notes";

const NOTES_URL = "http://localhost:8000/api/notes";

const STORED_NOTE = { id: 1, text: "Buy milk", created_at: "2026-07-31T09:15:00+00:00" };

/** A minimal stand-in for the parts of `Response` this client reads. */
function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function errorResponse(status: number) {
  return {
    ok: false,
    status,
    json: async () => ({ detail: "nope" }),
  };
}

function stubFetch(implementation: () => unknown) {
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listNotes", () => {
  it("requests the notes endpoint and returns the parsed notes", async () => {
    const fetchMock = stubFetch(async () => jsonResponse([STORED_NOTE]));

    await expect(listNotes()).resolves.toEqual([STORED_NOTE]);
    expect(fetchMock).toHaveBeenCalledWith(NOTES_URL, undefined);
  });

  it("returns an empty array when the backend has no notes", async () => {
    stubFetch(async () => jsonResponse([]));

    await expect(listNotes()).resolves.toEqual([]);
  });

  it("throws an ApiError carrying the status when the backend answers 500", async () => {
    stubFetch(async () => errorResponse(500));

    const error = await listNotes().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).toContain("500");
  });

  it("throws an ApiError with no status when fetch rejects", async () => {
    stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    const error = await listNotes().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBeNull();
    expect((error as ApiError).message).toMatch(/could not be reached/i);
  });

  it("throws an ApiError when the body is not valid JSON", async () => {
    stubFetch(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    }));

    const error = await listNotes().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(200);
    expect((error as ApiError).message).toMatch(/unexpected response/i);
  });

  it("throws an ApiError when the body is a 2xx but not an array", async () => {
    stubFetch(async () => jsonResponse({ notes: [STORED_NOTE] }));

    await expect(listNotes()).rejects.toBeInstanceOf(ApiError);
  });

  it.each([
    ["a note with a non-numeric id", { ...STORED_NOTE, id: "1" }],
    ["a note missing created_at", { id: 1, text: "Buy milk" }],
    ["a null element", null],
    ["a primitive element", "Buy milk"],
  ])("throws an ApiError when the array contains %s", async (_label, element) => {
    stubFetch(async () => jsonResponse([element]));

    await expect(listNotes()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("createNote", () => {
  it("posts the text as JSON and returns the created note", async () => {
    const fetchMock = stubFetch(async () => jsonResponse(STORED_NOTE, 201));

    await expect(createNote("Buy milk")).resolves.toEqual(STORED_NOTE);
    expect(fetchMock).toHaveBeenCalledWith(NOTES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Buy milk" }),
    });
  });

  it("throws an ApiError carrying the status when the backend rejects the note", async () => {
    stubFetch(async () => errorResponse(422));

    const error = await createNote("").catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
  });

  it("throws an ApiError when the created body is not a note", async () => {
    stubFetch(async () => jsonResponse({ id: 1 }, 201));

    await expect(createNote("Buy milk")).rejects.toBeInstanceOf(ApiError);
  });

  it("throws an ApiError with no status when fetch rejects", async () => {
    stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    const error = await createNote("Buy milk").catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBeNull();
  });
});
