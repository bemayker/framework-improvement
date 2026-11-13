import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackendVersion } from "./version";

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
    vi.resetModules();
  });

  it("returns the backend version from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(getBackendVersion()).resolves.toBe("0.1.0");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("requests the configured VITE_API_BASE_URL when one is set", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://api.example.test:9000");
    vi.resetModules();
    const { getBackendVersion: configured } = await import("./version");
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3" }));

    await expect(configured()).resolves.toBe("1.2.3");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.example.test:9000/api/version",
    );
  });

  it("ignores extra fields such as a build commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abc1234" }),
    );

    await expect(getBackendVersion()).resolves.toBe("0.1.0");
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the backend reports an empty version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "   " }));

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}),
    } as Response);

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the response has no string version field", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response shape",
    );
  });
});
