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

describe("version API client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("requests GET /api/version from the default API base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await getBackendBuildInfo();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { getBackendBuildInfo: getVersionWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await getVersionWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://notes.example.test/api/version",
    );
  });

  it("returns the version and the first 7 characters of the commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0123456789ab" }),
    );

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456",
    });
  });

  it("returns a null commit when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "unknown" }),
    );

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is missing, blank or not a string", async () => {
    const expected = { version: "0.1.0", commit: null };

    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));
    await expect(getBackendBuildInfo()).resolves.toEqual(expected);

    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "  " }));
    await expect(getBackendBuildInfo()).resolves.toEqual(expected);

    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: 42 }));
    await expect(getBackendBuildInfo()).resolves.toEqual(expected);
  });

  it("returns null when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({ version: "0.1.0" }),
    } as Response);

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null when the request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it("returns null when the body has no string version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));
    await expect(getBackendBuildInfo()).resolves.toBeNull();

    fetchMock.mockResolvedValue(okResponse({}));
    await expect(getBackendBuildInfo()).resolves.toBeNull();

    fetchMock.mockResolvedValue(okResponse(null));
    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });
});
