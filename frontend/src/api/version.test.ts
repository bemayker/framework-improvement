import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackendVersionInfo } from "./version";

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
  });

  it("returns the version and the commit from GET /api/version", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abcdef123456" }),
    );

    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "abcdef123456",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("returns a null commit when the response carries no usable commit", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));
    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "" }));
    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: 42 }));
    await expect(getBackendVersionInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(getBackendVersionInfo()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the response body carries no version string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));
    await expect(getBackendVersionInfo()).rejects.toThrow(
      "Loading the version failed",
    );

    fetchMock.mockResolvedValue(okResponse({}));
    await expect(getBackendVersionInfo()).rejects.toThrow(
      "Loading the version failed",
    );

    fetchMock.mockResolvedValue(okResponse({ version: "" }));
    await expect(getBackendVersionInfo()).rejects.toThrow(
      "Loading the version failed",
    );
  });
});
