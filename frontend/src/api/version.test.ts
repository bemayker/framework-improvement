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

  it("requests the version from GET /api/version on the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "a1b2c3d4e5f6" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "a1b2c3d4e5f6",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("resolves the version and the commit from GET /api/version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "2.0.1", commit: "0123456789ab" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "2.0.1",
      commit: "0123456789ab",
    });
  });

  it("resolves a null commit when the backend reports the unknown commit", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("resolves a null commit when the commit is missing or not a string", async () => {
    for (const body of [
      { version: "0.1.0" },
      { version: "0.1.0", commit: "" },
      { version: "0.1.0", commit: 42 },
      { version: "0.1.0", commit: null },
    ]) {
      fetchMock.mockResolvedValue(okResponse(body));
      await expect(fetchBackendVersion()).resolves.toEqual({
        version: "0.1.0",
        commit: null,
      });
    }
  });

  it("uses VITE_API_BASE_URL for the version request when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchBackendVersion: fetchWithConfiguredBase } = await import("./version");
    fetchMock.mockResolvedValue(okResponse({ version: "2.3.4" }));

    await fetchWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });

  it("rejects when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("rejects when the body has no version string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));
    await expect(fetchBackendVersion()).rejects.toThrow("no usable version");

    fetchMock.mockResolvedValue(okResponse({ version: "" }));
    await expect(fetchBackendVersion()).rejects.toThrow("no usable version");

    fetchMock.mockResolvedValue(okResponse({}));
    await expect(fetchBackendVersion()).rejects.toThrow("no usable version");

    fetchMock.mockResolvedValue(okResponse(null));
    await expect(fetchBackendVersion()).rejects.toThrow("no usable version");
  });

  it("rejects when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).rejects.toThrow("no usable version");
  });

  it("rejects when the network request itself fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });
});
