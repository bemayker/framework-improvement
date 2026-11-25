import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

function stubFetch(response: Partial<Response> & { json?: () => unknown }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the version from the backend /api/version endpoint", async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "0123456789ab" }),
    });

    const result = await fetchBackendVersion();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/version$/);
    expect(result).toEqual({ version: "0.1.0", commit: "0123456" });
  });

  it("returns the version and the commit cut to its first 7 characters", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "0123456789ab" }),
    });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456",
    });
  });

  it("keeps a commit shorter than 7 characters as it is", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "abc12" }),
    });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc12",
    });
  });

  it("returns a null commit when the backend reports the unknown commit sentinel", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "unknown" }),
    });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the response has no string commit", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "0.1.0" }) });
    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: 12345 }),
    });
    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "" }),
    });
    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "unknown" }) });

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("throws when the response is not OK", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Server Error" });

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 500 Server Error",
    );
  });

  it("throws when the response has no string version", async () => {
    stubFetch({ ok: true, json: async () => ({ version: 3 }) });

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Unexpected version response",
    );
  });
});
