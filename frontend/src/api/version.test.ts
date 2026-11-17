import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

// `fetch` is stubbed (not the module) so the real client body runs.
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
  });

  it("fetches the version from GET /api/version on the configured base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("returns null when the request fails with a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).resolves.toBeNull();
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

  it("returns null when the body has no version string", async () => {
    fetchMock.mockResolvedValue(okResponse({}));
    await expect(fetchBackendVersion()).resolves.toBeNull();

    fetchMock.mockResolvedValue(okResponse({ version: 3 }));
    await expect(fetchBackendVersion()).resolves.toBeNull();

    fetchMock.mockResolvedValue(okResponse({ version: "" }));
    await expect(fetchBackendVersion()).resolves.toBeNull();

    fetchMock.mockResolvedValue(okResponse(null));
    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });
});
