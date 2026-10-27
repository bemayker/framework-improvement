import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBackendBuildInfo } from "./version";

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

  it("returns the backend version and commit from the default base URL", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "a1b2c3d4e5f6" }),
    );

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "a1b2c3d4e5f6",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("trims the commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: " a1b2c3d4e5f6 " }),
    );

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "a1b2c3d4e5f6",
    });
  });

  it("returns a null commit when the body has no commit", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: 1 }));

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is blank", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "   " }));

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "unknown" }),
    );

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null version when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "unknown", commit: "a1b2c3d4e5f6" }),
    );

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: null,
      commit: "a1b2c3d4e5f6",
    });
  });

  it("returns a null version when the version is empty or blank", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "   " }));

    await expect(fetchBackendBuildInfo()).resolves.toEqual({
      version: null,
      commit: null,
    });
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(fetchBackendBuildInfo()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the body has no string version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 1 }));

    await expect(fetchBackendBuildInfo()).rejects.toThrow(
      "Loading the version failed",
    );
  });

  it("propagates a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendBuildInfo()).rejects.toThrow("Failed to fetch");
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchBackendBuildInfo: fetchWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://notes.example.test/api/version",
    );
  });
});
