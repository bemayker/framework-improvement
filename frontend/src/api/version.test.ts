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

  it("returns the version and commit the backend sent, from the default base URL", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "a1b2c3d" }),
    );

    await expect(fetchAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "a1b2c3d",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("cuts a 12-character commit to its first 7 characters", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "a1b2c3d4e5f6" }),
    );

    await expect(fetchAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "a1b2c3d",
    });
  });

  it("keeps a commit shorter than 7 characters whole", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc12" }));

    await expect(fetchAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc12",
    });
  });

  it("returns a null commit for the backend's unknown sentinel", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "unknown" }),
    );

    await expect(fetchAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit for an empty commit", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "  " }));

    await expect(fetchAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the body has no commit", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the commit is not a string", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: 12345 }));

    await expect(fetchAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("trims whitespace around the version and the commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: " 1.2.3 ", commit: " a1b2c3d4e5f6 " }),
    );

    await expect(fetchAppVersion()).resolves.toEqual({
      version: "1.2.3",
      commit: "a1b2c3d",
    });
  });

  it("returns null for the backend's unknown version sentinel", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "unknown", commit: "a1b2c3d4e5f6" }),
    );

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
