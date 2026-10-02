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

function failedResponse(status: number, statusText: string): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({}),
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

  it("returns the version and commit from GET /api/version", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abcdef1234567890" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abcdef1234567890",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("tolerates and ignores response fields other than version and commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abc1234", extra: "ignored" }),
    );

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc1234",
    });
  });

  it.each([
    ["a missing commit", { version: "0.1.0" }],
    ["an empty commit", { version: "0.1.0", commit: "" }],
    ["a non-string commit", { version: "0.1.0", commit: 1234567 }],
    ["a null commit", { version: "0.1.0", commit: null }],
    ["the unknown commit sentinel", { version: "0.1.0", commit: "unknown" }],
  ])("resolves the version with a null commit on %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("rejects with the status when the response is not OK", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it.each([
    ["a missing version", {}],
    ["an empty version", { version: "" }],
    ["a non-string version", { version: 42 }],
    ["a null body", null],
  ])("rejects on %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed",
    );
  });

  it("rejects on the backend's unknown sentinel", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "unknown" }));

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed",
    );
  });

  it("propagates a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchBackendVersion()).rejects.toThrow("Failed to fetch");
  });

  it("uses VITE_API_BASE_URL when it is set", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test");
    vi.resetModules();
    const { fetchBackendVersion: freshFetch } = await import("./version");
    fetchMock.mockResolvedValue(okResponse({ version: "1.2.3" }));

    await expect(freshFetch()).resolves.toEqual({
      version: "1.2.3",
      commit: null,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/version",
    );
  });
});
