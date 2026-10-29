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
      okResponse({ version: "0.1.0", commit: "3761feee7215" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "3761feee7215",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("ignores extra fields in the body", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abc1234", extra: "x" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc1234",
    });
  });

  it("trims whitespace around the version and the commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: " 1.2.3 ", commit: " abc1234 " }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "1.2.3",
      commit: "abc1234",
    });
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}),
    } as Response);

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("propagates a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });

  it.each([
    ["missing", {}],
    ["empty", { version: "" }],
    ["blank", { version: "   " }],
    ["not a string", { version: 1 }],
    ["null", { version: null }],
    ["the backend's unknown sentinel", { version: "unknown" }],
  ])("returns a null version when the version is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse({ commit: "abc1234", ...body }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: null,
      commit: "abc1234",
    });
  });

  it.each([
    ["missing", {}],
    ["empty", { commit: "" }],
    ["blank", { commit: "   " }],
    ["not a string", { commit: 1 }],
    ["null", { commit: null }],
    ["the backend's unknown sentinel", { commit: "unknown" }],
  ])("returns a null commit when the commit is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", ...body }));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns both fields null for a null body", async () => {
    fetchMock.mockResolvedValue(okResponse(null));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: null,
      commit: null,
    });
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
