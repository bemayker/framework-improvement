import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackendVersion } from "./version";

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

  it("returns the version the backend sent, from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(getBackendVersion()).resolves.toBe("0.1.0");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("trims whitespace around the version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: " 1.2.3 " }));

    await expect(getBackendVersion()).resolves.toBe("1.2.3");
  });

  it("returns null for the backend's unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("returns null for a blank version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "   " }));

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}),
    } as Response);

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the body has no string version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

    await expect(getBackendVersion()).rejects.toThrow("unexpected response shape");
  });

  it("throws when the body is not an object", async () => {
    fetchMock.mockResolvedValue(okResponse(null));

    await expect(getBackendVersion()).rejects.toThrow("unexpected response shape");
  });

  it("ignores extra fields in the response", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abc1234" }),
    );

    await expect(getBackendVersion()).resolves.toBe("0.1.0");
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { getBackendVersion: getVersionWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await getVersionWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });
});
