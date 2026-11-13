import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchVersion } from "./version";

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

  it("fetches the version from /api/version on the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    const version = await fetchVersion();

    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
    expect(version).toBe("0.1.0");
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}),
    } as Response);

    await expect(fetchVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the response has no version string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 5 }));

    await expect(fetchVersion()).rejects.toThrow(
      "Loading the version failed: unexpected response",
    );
  });
});
