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

  it("returns the version with the commit shortened to 7 characters and requests the default endpoint", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0123456789ab" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      shortCommit: "0123456",
    });
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("returns a commit shorter than 7 characters whole", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      shortCommit: "abc",
    });
  });

  it.each([
    ["the unknown sentinel", { version: "0.1.0", commit: "unknown" }],
    ["a missing commit", { version: "0.1.0" }],
    ["an empty commit", { version: "0.1.0", commit: "" }],
    ["a non-string commit", { version: "0.1.0", commit: 1234567 }],
    ["a null commit", { version: "0.1.0", commit: null }],
  ])("resolves the version with no short commit for %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      shortCommit: null,
    });
  });

  it("returns null when the backend reports the unknown version sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null for the unknown version even when a commit is present", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "unknown", commit: "0123456789ab" }),
    );

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

    await expect(freshFetchBackendVersion()).resolves.toEqual({
      version: "2.0.0",
      shortCommit: null,
    });
    expect(fetchMock).toHaveBeenCalledWith("http://api.example.test/api/version");
  });
});
