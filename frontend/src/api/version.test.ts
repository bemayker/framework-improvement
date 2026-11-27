import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchVersion } from "./version";

function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests GET /api/version from the default base URL and returns the version", async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: "1.2.3", commit: "abcdef1234567890" }),
    });

    await expect(fetchVersion()).resolves.toMatchObject({ version: "1.2.3" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/version$/);
  });

  it("returns the version and the commit from GET /api/version", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "1.2.3", commit: "abcdef1234567890" }),
    });

    await expect(fetchVersion()).resolves.toEqual({
      version: "1.2.3",
      commit: "abcdef1234567890",
    });
  });

  it("returns a null commit when the body carries no string commit", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "1.2.3" }) });
    await expect(fetchVersion()).resolves.toEqual({ version: "1.2.3", commit: null });

    stubFetch({ ok: true, json: async () => ({ version: "1.2.3", commit: 42 }) });
    await expect(fetchVersion()).resolves.toEqual({ version: "1.2.3", commit: null });
  });

  it("throws when the response is not OK", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Server Error" });

    await expect(fetchVersion()).rejects.toThrow(
      "Loading the version failed: 500 Server Error",
    );
  });

  it("throws when the body carries no string version", async () => {
    stubFetch({ ok: true, json: async () => ({ version: 3 }) });

    await expect(fetchVersion()).rejects.toThrow("unexpected response body");
  });
});
