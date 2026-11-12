import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackendVersionInfo } from "./version";

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

  it("fetches GET /api/version from the default base URL and returns the version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("returns the version and the commit cut to its first 7 characters", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "3f9c2a71b0de" }),
    );

    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "3f9c2a7",
    });
  });

  it("ignores extra fields in the response", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3", extra: true }));

    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "1.2.3",
      commit: null,
    });
  });

  it("returns a null commit when the response has no commit field", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(getBackendVersionInfo()).resolves.toMatchObject({ commit: null });
  });

  it("returns a null commit when the backend reports the unknown commit sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "unknown" }));

    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the backend reports a blank commit", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "   " }));

    await expect(getBackendVersionInfo()).resolves.toMatchObject({ commit: null });
  });

  it("returns a null commit when the commit is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: 12345 }));

    await expect(getBackendVersionInfo()).resolves.toMatchObject({ commit: null });
  });

  it("keeps a commit shorter than 7 characters whole", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc12" }));

    await expect(getBackendVersionInfo()).resolves.toMatchObject({ commit: "abc12" });
  });

  it("returns a null version when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(getBackendVersionInfo()).resolves.toMatchObject({ version: null });
  });

  it("returns a null version when the backend reports a blank version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "  " }));

    await expect(getBackendVersionInfo()).resolves.toMatchObject({ version: null });
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({}),
    } as Response);

    await expect(getBackendVersionInfo()).rejects.toThrow(
      "Loading the version failed: 500 Internal Server Error",
    );
  });

  it("throws when the response body has no version string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

    await expect(getBackendVersionInfo()).rejects.toThrow(
      "Loading the version failed: unexpected response shape",
    );
  });

  it("throws when the request itself fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getBackendVersionInfo()).rejects.toThrow("Failed to fetch");
  });
});
