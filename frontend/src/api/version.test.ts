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

  it("returns the version and commit the backend sent, from the default base URL", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0515c74d9e2f" }),
    );

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "0515c74d9e2f",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("trims whitespace around the version and the commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: " 1.2.3 ", commit: " abcdef123456 " }),
    );

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "1.2.3",
      commit: "abcdef123456",
    });
  });

  it("returns a null version for the backend's unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown", commit: "abc1234" }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: null,
      commit: "abc1234",
    });
  });

  it("returns a null version for a blank version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "   " }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: null,
      commit: null,
    });
  });

  it("returns a null commit for the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "unknown" }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit for a blank commit", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "  " }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit field is missing", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: 12345 }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
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

  it("throws when the body has no string version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

    await expect(getBackendBuildInfo()).rejects.toThrow("unexpected response shape");
  });

  it("throws when the body is not an object", async () => {
    fetchMock.mockResolvedValue(okResponse(null));

    await expect(getBackendBuildInfo()).rejects.toThrow("unexpected response shape");
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { getBackendBuildInfo: getBuildInfoWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await getBuildInfoWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });
});
