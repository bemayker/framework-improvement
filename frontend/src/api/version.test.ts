import { describe, it, expect, vi, afterEach } from "vitest";
import { getBackendVersion } from "./version";

function stubFetch(response: Partial<Response> & { json?: () => unknown }) {
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

  it("returns the version the backend reports, from the default base URL", async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: " 0.1.0 ", commit: "abc123" }),
    });

    await expect(getBackendVersion()).resolves.toBe("0.1.0");
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("requests the version from the configured VITE_API_BASE_URL", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://backend.example:9000");
    vi.resetModules();
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: "2.0.0" }),
    });

    const { getBackendVersion: freshClient } = await import("./version");

    await expect(freshClient()).resolves.toBe("2.0.0");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.example:9000/api/version",
    );
  });

  it("throws when the response is not OK", async () => {
    stubFetch({ ok: false, status: 503, statusText: "Service Unavailable" });

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: 503 Service Unavailable",
    );
  });

  it("throws when the response carries no version string", async () => {
    stubFetch({ ok: true, json: async () => ({ version: 42 }) });
    await expect(getBackendVersion()).rejects.toThrow("no version");

    stubFetch({ ok: true, json: async () => ({}) });
    await expect(getBackendVersion()).rejects.toThrow("no version");

    stubFetch({ ok: true, json: async () => ({ version: "   " }) });
    await expect(getBackendVersion()).rejects.toThrow("no version");
  });

  it("throws when the response carries the backend's unknown sentinel", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "unknown" }) });

    await expect(getBackendVersion()).rejects.toThrow("no version");
  });
});
