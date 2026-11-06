import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

async function loadClient() {
  vi.resetModules();
  return import("./version");
}

describe("version API client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the backend version and requests /api/version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3", commit: "abc1234" }));
    const { getBackendVersion } = await loadClient();

    await expect(getBackendVersion()).resolves.toEqual({
      version: "1.2.3",
      commit: "abc1234",
    });
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("truncates a 12-character commit to its first 7 characters", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "1.2.3", commit: "0123456789ab" }),
    );
    const { getBackendVersion } = await loadClient();

    await expect(getBackendVersion()).resolves.toEqual({
      version: "1.2.3",
      commit: "0123456",
    });
  });

  it("resolves a null commit for the backend's unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3", commit: "unknown" }));
    const { getBackendVersion } = await loadClient();

    await expect(getBackendVersion()).resolves.toEqual({
      version: "1.2.3",
      commit: null,
    });
  });

  it("resolves a null commit when the commit field is missing", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3" }));
    const { getBackendVersion } = await loadClient();

    await expect(getBackendVersion()).resolves.toEqual({
      version: "1.2.3",
      commit: null,
    });
  });

  it.each([["empty", ""], ["blank", "   "], ["not a string", 123]])(
    "resolves a null commit when the commit is %s",
    async (_label, commit) => {
      fetchMock.mockResolvedValue(okResponse({ version: "1.2.3", commit }));
      const { getBackendVersion } = await loadClient();

      await expect(getBackendVersion()).resolves.toEqual({
        version: "1.2.3",
        commit: null,
      });
    },
  );

  it("rejects on a non-OK response", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({}),
    } as Response);
    const { getBackendVersion } = await loadClient();

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: 500 Internal Server Error",
    );
  });

  it("rejects when the body has no version field", async () => {
    fetchMock.mockResolvedValue(okResponse({ other: "x" }));
    const { getBackendVersion } = await loadClient();

    await expect(getBackendVersion()).rejects.toThrow("unexpected response body");
  });

  it("rejects when the body is not an object", async () => {
    fetchMock.mockResolvedValue(okResponse(null));
    const { getBackendVersion } = await loadClient();

    await expect(getBackendVersion()).rejects.toThrow("unexpected response body");
  });

  it("rejects when the version is an empty string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "" }));
    const { getBackendVersion } = await loadClient();

    await expect(getBackendVersion()).rejects.toThrow("unexpected response body");
  });

  it("rejects when the version is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 1 }));
    const { getBackendVersion } = await loadClient();

    await expect(getBackendVersion()).rejects.toThrow("unexpected response body");
  });

  it("treats the backend's unknown sentinel as unresolved", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));
    const { getBackendVersion } = await loadClient();

    await expect(getBackendVersion()).rejects.toThrow("unknown");
  });

  it("propagates a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { getBackendVersion } = await loadClient();

    await expect(getBackendVersion()).rejects.toThrow("Failed to fetch");
  });

  it("honours the VITE_API_BASE_URL override", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://example.test:9000");
    fetchMock.mockResolvedValue(okResponse({ version: "2.0.0" }));
    const { getBackendVersion } = await loadClient();

    await getBackendVersion();

    expect(fetchMock).toHaveBeenCalledWith("http://example.test:9000/api/version");
  });
});
