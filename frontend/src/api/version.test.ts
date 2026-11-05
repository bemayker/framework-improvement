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

describe("getBackendVersion", () => {
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

    await expect(getBackendVersion()).resolves.toBe("0.1.0");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("ignores extra fields in the body", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3", commit: "abc" }));

    await expect(getBackendVersion()).resolves.toBe("1.2.3");
  });

  it("trims surrounding whitespace", async () => {
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

  it("returns null when the version is missing", async () => {
    fetchMock.mockResolvedValue(okResponse({}));

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the version is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

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

  it("propagates a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getBackendVersion()).rejects.toThrow("Failed to fetch");
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
