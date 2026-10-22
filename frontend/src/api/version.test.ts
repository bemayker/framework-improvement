import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

// `fetch` is stubbed (not the module), so the real client body runs.
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

  it("returns the backend version from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("returns a null version when the backend reports its unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: null,
      commit: null,
    });
  });

  it("returns the commit the backend reports next to the version", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0123456789ab" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456789ab",
    });
  });

  it("returns a null commit when the backend reports its unknown commit sentinel", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "unknown" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it.each([
    ["missing", {}],
    ["empty", { commit: "" }],
    ["a number", { commit: 123 }],
    ["null", { commit: null }],
  ])(
    "returns a null commit without rejecting when the commit is %s",
    async (_label, extra) => {
      fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", ...extra }));

      await expect(fetchBackendVersion()).resolves.toEqual({
        version: "0.1.0",
        commit: null,
      });
    },
  );

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the body has no version", async () => {
    fetchMock.mockResolvedValue(okResponse({}));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response",
    );
  });

  it("throws when the version is an empty string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "" }));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response",
    );
  });

  it("throws when the body is not an object", async () => {
    fetchMock.mockResolvedValue(okResponse(null));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response",
    );
  });

  it("propagates a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchBackendVersion: fetchWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://notes.example.test/api/version",
    );
  });
});
