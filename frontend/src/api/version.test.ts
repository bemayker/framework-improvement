import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

const fetchMock = vi.fn<typeof fetch>();

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  } as Response;
}

describe("version API client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the version and the first 7 characters of the commit from /api/version", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "4e631128d728" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "4e63112",
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("resolves a null version for the backend unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: null,
      commit: null,
    });
  });

  it("resolves a null version for an empty version string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: null,
      commit: null,
    });
  });

  it("resolves a null commit for the backend unknown commit sentinel", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "unknown" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("resolves a null commit when the response carries no commit string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));
    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "" }));
    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: 42 }));
    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("throws when the response is not OK", async () => {
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

  it("throws when the response has no version string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response",
    );
  });

  it("propagates a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchBackendVersion: fetchWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://notes.example.test/api/version",
    );
  });
});
