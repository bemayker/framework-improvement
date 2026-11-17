import { describe, it, expect, vi, afterEach } from "vitest";
import { getAppVersion } from "./version";

function stubFetch(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getAppVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the version from GET /api/version", async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0" }),
    });

    await expect(getAppVersion()).resolves.toBe("0.1.0");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/version$/);
  });

  it("returns null when the backend reports the unknown sentinel", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "unknown" }) });

    await expect(getAppVersion()).resolves.toBeNull();
  });

  it("returns null when the response has no version string", async () => {
    stubFetch({ ok: true, json: async () => ({ version: 42 }) });

    await expect(getAppVersion()).resolves.toBeNull();
  });

  it("rejects when the backend answers with a non-OK status", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Server Error" });

    await expect(getAppVersion()).rejects.toThrow(
      "Loading the version failed: 500 Server Error",
    );
  });
});
