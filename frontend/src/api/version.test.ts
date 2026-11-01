import { describe, it, expect, vi, afterEach } from "vitest";
import { API_BASE_URL } from "./baseUrl";
import { getBackendBuild } from "./version";

function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getBackendBuild", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the trimmed version from the configured base URL", async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: " 0.1.0 " }),
    });

    await expect(getBackendBuild()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/version`);
  });

  it("returns null when the backend reports unknown", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "unknown" }) });

    await expect(getBackendBuild()).resolves.toBeNull();
  });

  it("returns null when the version is blank", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "   " }) });

    await expect(getBackendBuild()).resolves.toBeNull();
  });

  it("throws with the status when the response is not OK", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Server Error" });

    await expect(getBackendBuild()).rejects.toThrow(
      "Loading the version failed: 500 Server Error",
    );
  });

  it("throws when the body has an unexpected shape", async () => {
    stubFetch({ ok: true, json: async () => ({ version: 3 }) });

    await expect(getBackendBuild()).rejects.toThrow("unexpected response shape");
  });

  it("throws when the body is not an object", async () => {
    stubFetch({ ok: true, json: async () => null });

    await expect(getBackendBuild()).rejects.toThrow("unexpected response shape");
  });

  it("propagates a rejected fetch", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(getBackendBuild()).rejects.toThrow("offline");
  });

  it("cuts a 12-character commit to its first 7 characters", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "0123456789ab" }),
    });

    await expect(getBackendBuild()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456",
    });
  });

  it("keeps a commit of 7 characters or fewer", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "abc12" }),
    });

    await expect(getBackendBuild()).resolves.toEqual({
      version: "0.1.0",
      commit: "abc12",
    });
  });

  it.each([
    ["unknown", { commit: "unknown" }],
    ["blank", { commit: "  " }],
    ["missing", {}],
    ["non-string", { commit: 3 }],
  ])("gives a null commit and keeps the version when the commit is %s", async (_label, extra) => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", ...extra }),
    });

    await expect(getBackendBuild()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });
});
