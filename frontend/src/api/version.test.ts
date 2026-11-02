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

  it("returns the version the backend sent, from the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchAppVersion()).resolves.toBe("0.1.0");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("trims whitespace around the version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: " 1.2.3 " }));

    await expect(fetchAppVersion()).resolves.toBe("1.2.3");
  });

  it("returns null for the backend's unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("returns null for an empty version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "" }));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("returns null when the body has no version", async () => {
    fetchMock.mockResolvedValue(okResponse({}));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("returns null when the version is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: 3 }));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(fetchAppVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });
});
