import { describe, it, expect, vi, afterEach } from "vitest";
import { getBackendVersion } from "./version";

function stubFetch(response: Partial<Response> & { json?: () => unknown }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function okResponse(body: unknown) {
  return { ok: true, status: 200, statusText: "OK", json: async () => body };
}

describe("getBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves the version string from the response body", async () => {
    stubFetch(okResponse({ version: "0.1.0" }));

    await expect(getBackendVersion()).resolves.toBe("0.1.0");
  });

  it("ignores extra fields in the response body", async () => {
    stubFetch(okResponse({ version: "0.1.0", commit: "abc1234" }));

    await expect(getBackendVersion()).resolves.toBe("0.1.0");
  });

  it("requests /api/version on the shared base URL", async () => {
    const fetchMock = stubFetch(okResponse({ version: "0.1.0" }));

    await getBackendVersion();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("rejects with the status when the response is not OK", async () => {
    stubFetch({ ok: false, status: 503, statusText: "Service Unavailable" });

    await expect(getBackendVersion()).rejects.toThrow(
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

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed",
    );
  });

  it("rejects on the backend's unknown sentinel", async () => {
    stubFetch(okResponse({ version: "unknown" }));

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed",
    );
  });

  it("rejects when the network request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(getBackendVersion()).rejects.toThrow("offline");
  });
});
