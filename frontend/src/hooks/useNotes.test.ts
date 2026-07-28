import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useNotes } from "./useNotes";
import type { Note } from "../api/notes";

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe("useNotes", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads notes on mount", async () => {
    const loaded: Note[] = [{ id: 1, text: "Buy milk", created_at: "2026-07-28T09:41:12.334Z" }];
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(loaded));

    const { result } = renderHook(() => useNotes());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.notes).toEqual(loaded);
    expect(result.current.loadError).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("prepends the created note after a successful submit, without refetching", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]));
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const created: Note = { id: 2, text: "Call the dentist", created_at: "2026-07-28T09:44:02.011Z" };
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(created, true, 201));

    await act(async () => {
      await result.current.addNote("Call the dentist");
    });

    expect(result.current.notes).toEqual([created]);
    expect(result.current.submitError).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("surfaces a request failure on submit without changing the notes list", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]));
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ detail: "Note text must not be empty." }, false, 422),
    );

    await act(async () => {
      await result.current.addNote("Buy milk");
    });

    expect(result.current.submitError).toBe("Note text must not be empty.");
    expect(result.current.notes).toEqual([]);
  });

  it("surfaces a load failure when the initial fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useNotes());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.loadError).toBe(
      "Could not reach the server. Check your connection and try again.",
    );
    expect(result.current.notes).toEqual([]);
  });
});
