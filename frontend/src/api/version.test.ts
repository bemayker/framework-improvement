import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackendBuildInfo } from "./version";

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

describe("getBackendBuildInfo", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the version the backend reports, from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("cuts a 12-character commit to its first 7 characters", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "3f2a9c1d4e5b" }),
    );

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "3f2a9c1",
    });
  });

  it("keeps a commit shorter than 7 characters whole", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc" }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc",
    });
  });

  it("trims surrounding whitespace from the version and the commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: " 1.2.3 ", commit: "  3f2a9c1d4e5b " }),
    );

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "1.2.3",
      commit: "3f2a9c1",
    });
  });

  it("returns a null commit when the commit is missing", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: 1234567 }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is blank", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "   " }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit for the backend's unknown sentinel", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "unknown" }),
    );

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns null for the backend's unknown version sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null for a blank version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "   " }));

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null when the version is missing", async () => {
    fetchMock.mockResolvedValue(okResponse({}));

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null when the version is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null for an unusable version even when a commit is present", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "unknown", commit: "3f2a9c1d4e5b" }),
    );

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}),
    } as Response);

    await expect(getBackendBuildInfo()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("propagates a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getBackendBuildInfo()).rejects.toThrow("Failed to fetch");
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { getBackendBuildInfo: getInfoWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await getInfoWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });
});
