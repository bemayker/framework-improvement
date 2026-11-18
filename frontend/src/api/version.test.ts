import { describe, it, expect, vi, afterEach } from "vitest";
import { getBackendVersion } from "./version";

function stubFetch(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns the version the backend sent, from the default base URL", async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "unknown" }),
    });

    await expect(getBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("returns the version and the 7-character commit the backend sent", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "0123456789ab" }),
    });

    await expect(getBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: "0123456",
    });
  });

  it("resolves a null commit when the backend reports the unknown commit", async () => {
    stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "unknown" }),
    });

    await expect(getBackendVersion()).resolves.toEqual({
      version: "0.1.0",
      commit: null,
    });
  });

  it("resolves a null commit when the body has no string commit", async () => {
    for (const body of [
      { version: "0.1.0" },
      { version: "0.1.0", commit: "" },
      { version: "0.1.0", commit: 12345 },
    ]) {
      stubFetch({ ok: true, json: async () => body });

      await expect(getBackendVersion()).resolves.toEqual({
        version: "0.1.0",
        commit: null,
      });
    }
  });

  it("resolves null when the backend reports the unknown sentinel", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "unknown" }) });

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("throws with the status and reason when the response is not OK", async () => {
    stubFetch({ ok: false, status: 503, statusText: "Service Unavailable" });

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the body has no non-empty string version", async () => {
    stubFetch({ ok: true, json: async () => ({ version: 1 }) });
    await expect(getBackendVersion()).rejects.toThrow("malformed");

    stubFetch({ ok: true, json: async () => ({ version: "" }) });
    await expect(getBackendVersion()).rejects.toThrow("malformed");

    stubFetch({ ok: true, json: async () => null });
    await expect(getBackendVersion()).rejects.toThrow("malformed");
  });

  it("reads the configured base URL instead of the default", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://api.example.test");
    vi.resetModules();
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: "2.0.0" }),
    });

    const { getBackendVersion: freshClient } = await import("./version");

    await expect(freshClient()).resolves.toEqual({
      version: "2.0.0",
      commit: null,
    });
    expect(fetchMock).toHaveBeenCalledWith("http://api.example.test/api/version");
  });
});
