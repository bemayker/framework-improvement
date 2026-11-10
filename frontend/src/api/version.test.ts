import { describe, it, expect, vi, afterEach } from "vitest";
import { API_BASE_URL } from "./baseUrl";
import { getBackendBuildInfo } from "./version";

function stubFetch(response: Partial<Response> & { json?: () => unknown }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function okResponse(body: unknown) {
  return { ok: true, status: 200, statusText: "OK", json: async () => body };
}

describe("getBackendBuildInfo", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves the version and the commit from the response body", async () => {
    stubFetch(okResponse({ version: "0.1.0", commit: "0123456789ab" }));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456789ab",
    });
  });

  it.each([
    ["the unknown sentinel", { version: "0.1.0", commit: "unknown" }],
    ["a missing commit", { version: "0.1.0" }],
    ["an empty commit", { version: "0.1.0", commit: "" }],
    ["a non-string commit", { version: "0.1.0", commit: 3 }],
    ["a null commit", { version: "0.1.0", commit: null }],
  ])("resolves a null commit with the version intact for %s", async (_label, body) => {
    stubFetch(okResponse(body));

    await expect(getBackendBuildInfo()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("requests /api/version on the shared base URL", async () => {
    const fetchMock = stubFetch(okResponse({ version: "0.1.0" }));

    await getBackendBuildInfo();

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/version`);
  });

  it("rejects with the status when the response is not OK", async () => {
    stubFetch({ ok: false, status: 503, statusText: "Service Unavailable" });

    await expect(getBackendBuildInfo()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it.each([
    ["a missing version", {}],
    ["an empty version", { version: "" }],
    ["a non-string version", { version: 3 }],
    ["a null body", null],
  ])("rejects on %s", async (_label, body) => {
    stubFetch(okResponse(body));

    await expect(getBackendBuildInfo()).rejects.toThrow(
      "Loading the version failed",
    );
  });

  it("rejects on the backend's unknown sentinel", async () => {
    stubFetch(okResponse({ version: "unknown", commit: "0123456789ab" }));

    await expect(getBackendBuildInfo()).rejects.toThrow(
      "Loading the version failed",
    );
  });

  it("rejects when the network request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(getBackendBuildInfo()).rejects.toThrow("offline");
  });
});
