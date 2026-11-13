import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchBackendVersion } from "./version";

function stubFetch(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests GET /api/version and returns the backend version", async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0" }),
    });

    await expect(fetchBackendVersion()).resolves.toBe("0.1.0");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/version$/);
  });

  it("ignores extra fields in the response body", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.2.0", commit: "abc1234" }),
    });

    await expect(fetchBackendVersion()).resolves.toBe("0.2.0");
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "unknown" }) });

    await expect(fetchBackendVersion()).resolves.toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    stubFetch({ ok: false, status: 503, statusText: "Service Unavailable" });

    await expect(fetchBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the response has no version string", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "" }) });
    await expect(fetchBackendVersion()).rejects.toThrow(
      "unexpected response shape",
    );

    stubFetch({ ok: true, json: async () => ({}) });
    await expect(fetchBackendVersion()).rejects.toThrow(
      "unexpected response shape",
    );
  });
});
