import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchAppVersion } from "./version";

// `fetch` is stubbed, so the real client body runs (the notes.test.ts pattern).
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

describe("fetchAppVersion", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves the version from an OK body", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await expect(fetchAppVersion()).resolves.toBe("0.1.0");
  });

  it("ignores extra fields such as commit", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0", commit: "abc123" }));

    await expect(fetchAppVersion()).resolves.toBe("0.1.0");
  });

  it.each([
    ["a missing version", {}],
    ["an empty version", { version: "" }],
    ["a non-string version", { version: 3 }],
    ["the unknown sentinel", { version: "unknown" }],
    ["a null body", null],
  ])("resolves null for %s", async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(fetchAppVersion()).resolves.toBeNull();
  });

  it("rejects with the status and reason on a non-OK response", async () => {
    fetchMock.mockResolvedValue(failedResponse(503, "Service Unavailable"));

    await expect(fetchAppVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("rejects when the network request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchAppVersion()).rejects.toThrow("Failed to fetch");
  });

  it("requests the default base URL when VITE_API_BASE_URL is unset", async () => {
    fetchMock.mockResolvedValue(okResponse({ version: "0.1.0" }));

    await fetchAppVersion();

    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_VERSION_URL);
  });
});
