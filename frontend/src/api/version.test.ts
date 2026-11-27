import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

function stubFetchJson(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the version string from GET /api/version", async () => {
    const fetchMock = stubFetchJson({ version: "0.1.0" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/version$/);
  });

  it("returns the commit cut to its first 7 characters", async () => {
    stubFetchJson({ version: "0.1.0", commit: "0123456789ab" });
    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456",
    });

    stubFetchJson({ version: "0.1.0", commit: "abc" });
    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc",
    });
  });

  it("returns a null commit when the backend reports the unknown commit sentinel", async () => {
    stubFetchJson({ version: "0.1.0", commit: "unknown" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is missing, blank or not a string", async () => {
    for (const body of [
      { version: "0.1.0" },
      { version: "0.1.0", commit: "   " },
      { version: "0.1.0", commit: 12345 },
      { version: "0.1.0", commit: null },
    ]) {
      stubFetchJson(body);
      await expect(fetchBackendVersion()).resolves.toEqual({
        version: "0.1.0",
        commit: null,
      });
    }
  });

  it("returns null when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null on a non-OK response", async () => {
    stubFetchJson({ version: "0.1.0" }, { ok: false, status: 500 });

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the body has no version string", async () => {
    stubFetchJson({ version: 3 });
    await expect(fetchBackendVersion()).resolves.toBeNull();

    stubFetchJson({});
    await expect(fetchBackendVersion()).resolves.toBeNull();

    stubFetchJson(null);
    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the body is not valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
      }),
    );

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the version is an empty string", async () => {
    stubFetchJson({ version: "   " });

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    stubFetchJson({ version: "unknown" });

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });
});
