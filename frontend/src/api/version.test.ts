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

describe("fetchBackendVersion", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the version from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("ignores additional fields in the response", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc" }));

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");
  });

  it("returns null when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ version: "0.1.0" }),
    } as Response);

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the body is not JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response);

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it.each([
    ["missing", {}],
    ["empty", { version: "" }],
    ["not a string", { version: 1 }],
    ["null body", null],
    ["the unknown sentinel", { version: "unknown" }],
  ])("returns null when the version is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { fetchBackendVersion: fetchWithConfiguredBase } = await import(
      "./version"
    );
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });
});
