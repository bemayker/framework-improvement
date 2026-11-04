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

function failedResponse(status: number, statusText: string): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({}),
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
    vi.unstubAllEnvs();
  });

  it("returns the version the backend sent, from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchBackendVersion()).resolves.toEqual({ version: "0.1.0", commit: null });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("shortens a 12-character commit to its first 7 characters", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0123456789ab" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps a commit shorter than 7 characters as it is", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc" }));

    await expect(fetchBackendVersion()).resolves.toEqual({ version: "0.1.0", commit: "abc" });
  });

  it.each([
    ["the unknown sentinel", "unknown"],
    ["blank", "  "],
    ["empty", ""],
    ["not a string", 42],
    ["null", null],
  ])("returns a null commit, not an error, when the commit is %s", async (_label, commit) => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit }));

    await expect(fetchBackendVersion()).resolves.toEqual({ version: "0.1.0", commit: null });
  });

  it("returns null when the version is unknown even with a known commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "unknown", commit: "0123456789ab" }),
    );

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the version is blank", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "  " }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(500, "Internal Server Error"));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 500 Internal Server Error",
    );
  });

  it("throws when the body has no version field", async () => {
    fetchMock.mockResolvedValue(okResponse({}));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response shape",
    );
  });

  it("throws when the version is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 1 }));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response shape",
    );
  });

  it("propagates a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchBackendVersion: fetchWithConfiguredBase } = await import("./version");
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });
});
