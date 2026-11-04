import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";
import { API_BASE_URL } from "./baseUrl";

function mockFetchJson(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.ok === false ? "Service Unavailable" : "OK",
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the version and a null commit when the body has no commit", async () => {
    mockFetchJson({ version: "0.1.0" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("shortens a 12-character commit to its first 7 characters", async () => {
    mockFetchJson({ version: "0.1.0", commit: "5796772ab1cd" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "5796772",
    });
  });

  it("leaves a commit shorter than 7 characters unchanged", async () => {
    mockFetchJson({ version: "0.1.0", commit: "abc12" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc12",
    });
  });

  it("trims whitespace around the commit before shortening", async () => {
    mockFetchJson({ version: "0.1.0", commit: "  5796772ab1cd  " });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "5796772",
    });
  });

  it.each([["unknown"], [""], ["   "], [7], [null]])(
    "gives a null commit for %j without rejecting",
    async (commit) => {
      mockFetchJson({ version: "0.1.0", commit });

      await expect(fetchBackendVersion()).resolves.toEqual({
        version: "0.1.0",
        commit: null,
      });
    },
  );

  it("keeps a null version and a valid commit when the version is unknown", async () => {
    mockFetchJson({ version: "unknown", commit: "5796772ab1cd" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: null,
      commit: "5796772",
    });
  });

  it("calls the configured base URL at /api/version", async () => {
    const fetchMock = mockFetchJson({ version: "0.1.0" });

    await fetchBackendVersion();

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/version`);
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    mockFetchJson({ version: "unknown" });

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: null,
      commit: null,
    });
  });

  it("rejects on a non-2xx status", async () => {
    mockFetchJson({}, { ok: false, status: 503 });

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503",
    );
  });

  it("rejects on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(fetchBackendVersion()).rejects.toThrow("offline");
  });

  it.each([[{}], [{ version: 7 }], [{ version: "  " }], [null]])(
    "rejects on a malformed body %j",
    async (body) => {
      mockFetchJson(body);

      await expect(fetchBackendVersion()).rejects.toThrow("unexpected response shape");
    },
  );
});
