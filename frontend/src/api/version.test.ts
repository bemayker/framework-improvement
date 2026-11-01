import { describe, it, expect, vi, afterEach } from "vitest";
import { getBackendVersion } from "./version";

function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the trimmed version from the default base URL", async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: " 0.1.0 " }),
    });

    await expect(getBackendVersion()).resolves.toBe("0.1.0");
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("returns null when the backend reports unknown", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "unknown" }) });

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("returns null when the version is blank", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "   " }) });

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("throws with the status when the response is not OK", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Server Error" });

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: 500 Server Error",
    );
  });

  it("throws when the body has an unexpected shape", async () => {
    stubFetch({ ok: true, json: async () => ({ version: 3 }) });

    await expect(getBackendVersion()).rejects.toThrow("unexpected response shape");
  });

  it("throws when the body is not an object", async () => {
    stubFetch({ ok: true, json: async () => null });

    await expect(getBackendVersion()).rejects.toThrow("unexpected response shape");
  });

  it("propagates a rejected fetch", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(getBackendVersion()).rejects.toThrow("offline");
  });

  it("ignores extra fields in the body", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", build_commit: "abc123" }),
    });

    await expect(getBackendVersion()).resolves.toBe("0.1.0");
  });
});
