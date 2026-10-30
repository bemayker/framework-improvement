import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackendVersion } from "./version";

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

  it("returns the version from the body, from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(getBackendVersion()).resolves.toBe("0.1.0");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(DEFAULT_VERSION_URL);
  });

  it("ignores additional fields in the response", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc123" }));

    await expect(getBackendVersion()).resolves.toBe("0.1.0");
  });

  it("passes an abort signal so a hung backend cannot wait forever", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await getBackendVersion();

    const init = fetchMock.mock.calls[0][1];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(500, "Internal Server Error"));

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: 500 Internal Server Error",
    );
  });

  it.each([
    ["a missing version", {}],
    ["a non-string version", { version: 1 }],
    ["an empty version", { version: "" }],
    ["a blank version", { version: "   " }],
    ["a null body", null],
    ["a non-object body", "0.1.0"],
  ])("throws on %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response",
    );
  });

  it("rejects when the network request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getBackendVersion()).rejects.toThrow("Failed to fetch");
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { getBackendVersion: getVersionWithConfiguredBase } = await import("./version");
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await getVersionWithConfiguredBase();

    expect(fetchMock.mock.calls[0][0]).toBe("https://notes.example.test/api/version");
  });
});
