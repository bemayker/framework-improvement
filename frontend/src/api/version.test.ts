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

  it("returns the version and requests the default endpoint", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("ignores additional fields in the response", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc123" }));

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("throws when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("rejects when the network request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });

  it.each([
    ["an empty object", {}],
    ["an empty version string", { version: "" }],
    ["a non-string version", { version: 1 }],
    ["a null body", null],
  ])("throws on a malformed body: %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed",
    );
  });

  it("uses VITE_API_BASE_URL when it is set", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://api.example.test");
    vi.resetModules();
    const { fetchBackendVersion: freshFetchBackendVersion } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "2.0.0" }));

    await expect(freshFetchBackendVersion()).resolves.toBe("2.0.0");
    expect(fetchMock).toHaveBeenCalledWith("http://api.example.test/api/version");
  });
});
