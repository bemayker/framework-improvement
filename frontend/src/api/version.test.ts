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

  it("requests /api/version from the default base URL and returns the version", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "0123456789ab" }),
    );

    await expect(fetchBackendVersion()).resolves.toMatchObject({
      version: "0.1.0",
    });
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("returns the version and the commit from the response", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: " 0123456789ab " }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456789ab",
    });
  });

  it("returns a null commit when the backend reports the commit as unknown", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "unknown" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is missing or not a string", async () => {
    for (const body of [
      { version: "0.1.0" },
      { version: "0.1.0", commit: 42 },
      { version: "0.1.0", commit: null },
      { version: "0.1.0", commit: "   " },
    ]) {
      fetchMock.mockResolvedValue(okResponse(body));

      await expect(fetchBackendVersion()).resolves.toEqual({
        version: "0.1.0",
        commit: null,
      });
    }
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
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

  it("throws when the response has no usable version string", async () => {
    for (const body of [{}, { version: 3 }, { version: "   " }, null]) {
      fetchMock.mockResolvedValue(okResponse(body));

      await expect(fetchBackendVersion()).rejects.toThrow(
        "Loading the version failed: unexpected response",
      );
    }
  });

  it("propagates a network failure as the fetch rejection", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });
});
