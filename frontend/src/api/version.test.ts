import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBackendVersion } from "./version";

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

  it("calls /api/version on the default base URL", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await getBackendVersion();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });

  it("returns the version and ignores other fields such as commit", async () => {
    fetchMock.mockResolvedValue(
      okResponse({ version: "0.1.0", commit: "abc123def456" }),
    );

    await expect(getBackendVersion()).resolves.toBe("0.1.0");
  });

  it("trims surrounding whitespace from the version", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "  1.2.3 " }));

    await expect(getBackendVersion()).resolves.toBe("1.2.3");
  });

  it.each([
    ["missing", {}],
    ["blank", { version: "   " }],
    ["non-string", { version: 3 }],
    ["the unknown sentinel", { version: "unknown" }],
  ])("returns null when the version is %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}),
    } as Response);

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });
});
