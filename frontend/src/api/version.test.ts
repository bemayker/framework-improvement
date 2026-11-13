import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

const DEFAULT_VERSION_URL = "http://localhost:8010/api/version";

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(body), init);
}

describe("fetchBackendVersion", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests /api/version from the default base URL and returns the version", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ version: "0.1.0" }));

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");
    // With VITE_API_BASE_URL unset, the client falls back to :8010.
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("throws when the backend answers with a non-OK status", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({}, { status: 500, statusText: "Server Error" }),
    );

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 500 Server Error",
    );
  });

  it("returns null when the response carries no usable version", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await expect(fetchBackendVersion()).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(jsonResponse({ version: 3 }));
    await expect(fetchBackendVersion()).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(jsonResponse({ version: "  " }));
    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });
});
