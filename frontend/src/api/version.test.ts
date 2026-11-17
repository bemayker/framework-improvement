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

    await expect(getAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/version$/);
  });

  it("returns the first 7 characters of the commit from GET /api/version", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "4f2a9c1e7b3d" }),
    });

    await expect(getAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "4f2a9c1",
    });
  });

  it("returns a null commit when the backend reports the unknown sentinel", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "unknown" }),
    });

    await expect(getAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null commit when the response has no commit string", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: 42 }),
    });
    await expect(getAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    stubFetch({ ok: true, json: async () => ({ version: "0.1.0" }) });
    await expect(getAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });

    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "" }),
    });
    await expect(getAppVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("returns a null version when the backend reports the unknown sentinel", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "unknown" }) });

    await expect(getAppVersion()).resolves.toEqual({
      version: null,
      commit: null,
    });
  });

  it("returns a null version when the response has no version string", async () => {
    stubFetch({ ok: true, json: async () => ({ version: 42 }) });

    await expect(getAppVersion()).resolves.toEqual({
      version: null,
      commit: null,
    });
  });

  it("rejects when the backend answers with a non-OK status", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Server Error" });

    await expect(getAppVersion()).rejects.toThrow(
      "Loading the version failed: 500 Server Error",
    );
  });
});
