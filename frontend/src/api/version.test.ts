import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBackendVersion, UNRESOLVED_BUILD_COMMIT } from "./version";

function stubFetch(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests GET /api/version and returns the backend version", async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0" }),
    });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/version$/);
  });

  it("returns the version and the commit from the backend", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.2.0", commit: "4f2a9c1d8e7b" }),
    });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.2.0",
      commit: "4f2a9c1d8e7b",
    });
  });

  it("returns a null commit when the backend reports the unknown commit", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.2.0", commit: UNRESOLVED_BUILD_COMMIT }),
    });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.2.0",
      commit: null,
    });
  });

  it("returns a null commit for an empty, missing or non-string commit without rejecting", async () => {
    for (const body of [
      { version: "0.2.0", commit: "" },
      { version: "0.2.0" },
      { version: "0.2.0", commit: 42 },
    ]) {
      stubFetch({ ok: true, json: async () => body });
      await expect(fetchBackendVersion()).resolves.toEqual({
        version: "0.2.0",
        commit: null,
      });
    }
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "unknown" }) });

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    stubFetch({ ok: false, status: 503, statusText: "Service Unavailable" });

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the response has no version string", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "" }) });
    await expect(fetchBackendVersion()).rejects.toThrow(
      "unexpected response shape",
    );

    stubFetch({ ok: true, json: async () => ({}) });
    await expect(fetchBackendVersion()).rejects.toThrow(
      "unexpected response shape",
    );
  });
});
