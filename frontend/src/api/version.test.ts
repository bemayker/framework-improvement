import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

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
    vi.resetModules();
  });

  it("returns the version the backend reports", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3" }));

    await expect(fetchBackendVersion()).resolves.toBe("1.2.3");
  });

  it("returns null for the backend unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("throws when the backend answers with a non-OK status", async () => {
    fetchMock.mockResolvedValue(failedResponse(500, "Internal Server Error"));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 500 Internal Server Error",
    );
  });

  it("throws when the body carries no usable version string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 42 }));
    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed",
    );

    fetchMock.mockResolvedValue(okResponse({ version: "" }));
    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed",
    );

    fetchMock.mockResolvedValue(okResponse({}));
    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed",
    );
  });

  it("requests GET /api/version from the configured base URL", async () => {
    // Asserts the resolution of VITE_API_BASE_URL, not the 8010 fallback literal.
    vi.stubEnv("VITE_API_BASE_URL", "http://backend.example.test:9123");
    vi.resetModules();
    const { fetchBackendVersion: freshFetchBackendVersion } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3" }));

    await freshFetchBackendVersion();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.example.test:9123/api/version",
    );
  });
});
