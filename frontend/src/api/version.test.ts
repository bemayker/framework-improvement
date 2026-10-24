import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchAppVersion } from "./version";

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

describe("fetchAppVersion", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the version the backend reported, from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchAppVersion()).resolves.toBe("0.1.0");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("ignores extra fields a later backend version adds", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.2.0", commit: "abc" }));

    await expect(fetchAppVersion()).resolves.toBe("0.2.0");
  });

  it("returns null when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ version: "0.1.0" }),
    } as Response);

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("returns null when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("returns null when the body is not valid JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response);

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it.each([
    ["a body without a version", {}],
    ["a null body", null],
    ["a non-string version", { version: 1 }],
  ])("returns null for %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("returns null for an empty version string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "" }));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("returns null for the backend's unresolved 'unknown' sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchAppVersion: fetchWithConfiguredBase } = await import("./version");
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });
});
