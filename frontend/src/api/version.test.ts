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

  it("returns the version and commit from one request to the default base URL", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0123456789ab" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456789ab",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("ignores fields other than version and commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abc123", extra: "x" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc123",
    });
  });

  it("resolves a null version when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown", commit: "abc123" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: null,
      commit: "abc123",
    });
  });

  it("trims whitespace around the commit", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "  abc123  " }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc123",
    });
  });

  it.each([
    ["the unknown sentinel", { version: "0.1.0", commit: "unknown" }],
    ["a missing commit", { version: "0.1.0" }],
    ["a non-string commit", { version: "0.1.0", commit: 42 }],
    ["a null commit", { version: "0.1.0", commit: null }],
    ["a blank commit", { version: "0.1.0", commit: "   " }],
  ])("resolves a null commit without throwing for %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it.each([
    ["a missing version", {}],
    ["a non-string version", { version: 1 }],
    ["an empty version", { version: "  " }],
    ["a null body", null],
  ])("throws on a malformed body with %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response",
    );
  });

  it("propagates a network rejection", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });

  it("uses VITE_API_BASE_URL when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchBackendVersion: fetchWithConfiguredBase } = await import("./version");
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });
});
