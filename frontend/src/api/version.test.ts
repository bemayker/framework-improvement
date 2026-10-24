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

function failedResponse(status: number, statusText: string): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({}),
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

  it("returns the version and commit the backend sent, from the default base URL", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0123456789ab" }),
    );

    await expect(getBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456789ab",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it.each([
    ["missing", {}],
    ["not a string", { commit: 42 }],
    ["blank", { commit: "  " }],
    ["the unknown sentinel", { commit: "unknown" }],
  ])("returns a null commit when the commit is %s", async (_label, extra) => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", ...extra }));

    await expect(getBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns null, ignoring the commit, when the version is unknown", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "unknown", commit: "0123456789ab" }),
    );

    await expect(getBackendVersion()).resolves.toBeNull();
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

  it("returns null when the version is blank", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "  " }));

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the body has no version", async () => {
    fetchMock.mockResolvedValue(okResponse({}));

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response",
    );
  });

  it("throws when the version is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 42 }));

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response",
    );
  });

  it("propagates a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getBackendVersion()).rejects.toThrow("Failed to fetch");
  });
});
