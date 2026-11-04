import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getVersionInfo } from "./version";

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

  it("returns the version and commit the backend sent, from the default base URL", async () => {
    const body = { version: "0.1.0", commit: "0123456789ab" };
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(getVersionInfo()).resolves.toEqual(body);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(getVersionInfo()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the commit is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: 123 }));

    await expect(getVersionInfo()).rejects.toThrow("Unexpected version response");
  });

  it("throws when the body is null", async () => {
    fetchMock.mockResolvedValue(okResponse(null));

    await expect(getVersionInfo()).rejects.toThrow("Unexpected version response");
  });
});
