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

  it("returns the version and the commit cut to 7 characters, from the default base URL", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "a1b2c3d4e5f6" }),
    );

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "a1b2c3d",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("keeps a commit shorter than 7 characters whole", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc" }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc",
    });
  });

  it.each([
    ["the unknown sentinel", { version: "0.1.0", commit: "unknown" }],
    ["an empty string", { version: "0.1.0", commit: "" }],
    ["missing", { version: "0.1.0" }],
    ["not a string", { version: "0.1.0", commit: 42 }],
  ])("resolves to a null commit when the commit is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(getBackendBuildInfo()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("propagates a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getBackendBuildInfo()).rejects.toThrow("Failed to fetch");
  });

  it("resolves to null for the backend's unknown version sentinel, whatever the commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "unknown", commit: "a1b2c3d4e5f6" }),
    );

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it("resolves to null for an empty version string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "" }));

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it("resolves to null when the body has no string version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { getBackendBuildInfo: getBuildInfoWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await getBuildInfoWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://notes.example.test/api/version",
    );
  });
});
