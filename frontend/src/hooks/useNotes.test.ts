import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useNotes } from "./useNotes";

const savedNote = { id: 1, text: "Buy milk", created_at: "2026-07-28T09:41:12.334Z" };
const createdNote = { id: 2, text: "Call the dentist", created_at: "2026-07-28T09:44:02.011Z" };

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) };
}

const fetchMock = vi.fn();

describe("useNotes", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the saved notes on mount", async () => {
    fetchMock.mockResolvedValue(jsonResponse([savedNote]));

    const { result } = renderHook(() => useNotes());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notes).toEqual([savedNote]);
    expect(result.current.loadError).toBeNull();
  });

  it("prepends a created note so the newest one comes first", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([savedNote]));
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    fetchMock.mockResolvedValueOnce(jsonResponse(createdNote, 201));
    let wasSaved: boolean | undefined;
    await act(async () => {
      wasSaved = await result.current.addNote("Call the dentist");
    });

    expect(wasSaved).toBe(true);
    expect(result.current.notes).toEqual([createdNote, savedNote]);
    expect(result.current.submitError).toBeNull();
  });

  it("reports a load error when the initial request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useNotes());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toBe(
      "Cannot reach the server. Check your connection and try again.",
    );
    expect(result.current.notes).toEqual([]);
  });

  it("reports a submit error and keeps the existing notes when creating fails", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([savedNote]));
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Note text must not be empty." }, 422));
    let wasSaved: boolean | undefined;
    await act(async () => {
      wasSaved = await result.current.addNote("Call the dentist");
    });

    expect(wasSaved).toBe(false);
    expect(result.current.submitError).toBe("Note text must not be empty.");
    expect(result.current.notes).toEqual([savedNote]);
  });

  it("reports an error when the response is not the expected shape", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ notes: [] }));

    const { result } = renderHook(() => useNotes());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toBe("The server returned an unexpected response.");
  });
});
