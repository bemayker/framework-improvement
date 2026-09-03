import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getVersion } from "./version";

// The component tests mock this module wholesale, so nothing executed the
// client itself. Here `fetch` is stubbed instead of the module, so the real
// getVersion body runs, including its throw branches.
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

  it("returns the version the backend sent, from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(getVersion()).resolves.toBe("0.1.0");

    // With VITE_API_BASE_URL unset, the client falls back to :8010.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("trims surrounding whitespace from the reported version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: " 1.2.3 " }));

    await expect(getVersion()).resolves.toBe("1.2.3");
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(500, "Internal Server Error"));

    await expect(getVersion()).rejects.toThrow(
      "Loading the version failed: 500 Internal Server Error",
    );
  });

  it("throws when the body carries no version field", async () => {
    fetchMock.mockResolvedValue(okResponse({}));

    await expect(getVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response shape",
    );
  });

  it("throws when the reported version is an empty string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "" }));

    await expect(getVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response shape",
    );
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { getVersion: getVersionWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await getVersionWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://notes.example.test/api/version",
    );
  });
});
