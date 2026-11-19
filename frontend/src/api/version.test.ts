import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

const DEFAULT_VERSION_URL = "http://localhost:8010/api/version";

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  } as Response;
}

const fetchMock = vi.fn<typeof fetch>();

describe("version API client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the version the backend sent, from the default base URL", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "3f9a2c1d8e7b" }),
    );

    await expect(fetchBackendVersion()).resolves.toMatchObject({
      version: "0.1.0",
    });
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("returns the version and the commit cut to its first 7 characters", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "3f9a2c1d8e7b" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "3f9a2c1",
    });
  });

  it("returns a null commit when the backend reports the unknown commit sentinel", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "unknown" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the response carries no string commit", async () => {
    for (const body of [
      { version: "0.1.0" },
      { version: "0.1.0", commit: 42 },
      { version: "0.1.0", commit: "   " },
    ]) {
      fetchMock.mockResolvedValue(okResponse(body));

      await expect(fetchBackendVersion()).resolves.toEqual({
        version: "0.1.0",
        commit: null,
      });
    }
  });

  it("returns null when the backend has no version, even with a commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "unknown", commit: "3f9a2c1d8e7b" }),
    );

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the backend reports an empty version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}),
    } as Response);

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the response body carries no string version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed",
    );
  });
});
