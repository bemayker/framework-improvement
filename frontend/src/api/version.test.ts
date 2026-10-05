import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackendBuildInfo, VERSION_REQUEST_TIMEOUT_MS } from "./version";

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
    vi.restoreAllMocks();
  });

  it("calls /api/version on the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await getBackendBuildInfo();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      DEFAULT_VERSION_URL,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("aborts the request after VERSION_REQUEST_TIMEOUT_MS", async () => {
    const controller = new AbortController();
    const timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(controller.signal);
    // The hung-backend shape: never answers, rejects only when aborted.
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          );
        }),
    );

    const pending = getBackendBuildInfo();
    expect(timeoutSpy).toHaveBeenCalledWith(VERSION_REQUEST_TIMEOUT_MS);
    controller.abort(new DOMException("timed out", "TimeoutError"));

    await expect(pending).rejects.toMatchObject({ name: "TimeoutError" });
  });

  it("keeps the timeout positive and bounded", () => {
    expect(Number.isFinite(VERSION_REQUEST_TIMEOUT_MS)).toBe(true);
    expect(VERSION_REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
    expect(VERSION_REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(10_000);
  });

  it("returns the version and the commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abc123def456" }),
    );

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc123def456",
    });
  });

  it("trims surrounding whitespace from the version and the commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "  1.2.3 ", commit: " abc123def456  " }),
    );

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "1.2.3",
      commit: "abc123def456",
    });
  });

  it.each([
    ["missing", {}],
    ["blank", { version: "   " }],
    ["non-string", { version: 3 }],
    ["the unknown sentinel", { version: "unknown" }],
  ])("returns null when the version is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse({ commit: "abc123def456", ...body }));

    await expect(getBackendBuildInfo()).resolves.toBeNull();
  });

  it.each([
    ["missing", {}],
    ["blank", { commit: "  " }],
    ["non-string", { commit: 42 }],
    ["the unknown sentinel", { commit: "unknown" }],
  ])("returns a null commit when the commit is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", ...body }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}),
    } as Response);

    await expect(getBackendBuildInfo()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });
});
