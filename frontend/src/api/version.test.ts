import { describe, it, expect, vi, afterEach } from "vitest";
import { getBackendVersion } from "./version";

function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function okBody(body: unknown) {
  return { ok: true, status: 200, statusText: "OK", json: async () => body };
}

describe("getBackendVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("resolves the version string and calls the version endpoint", async () => {
    const fetchMock = stubFetch(okBody({ version: "0.1.0" }));

    await expect(getBackendVersion()).resolves.toBe("0.1.0");
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("resolves null for the unknown sentinel", async () => {
    stubFetch(okBody({ version: "unknown" }));

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("resolves null for an empty version", async () => {
    stubFetch(okBody({ version: "" }));

    await expect(getBackendVersion()).resolves.toBeNull();
  });

  it("rejects on a non-OK response", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Server Error" });

    await expect(getBackendVersion()).rejects.toThrow(
      "Loading the version failed: 500 Server Error",
    );
  });

  it("rejects when the body has no string version", async () => {
    stubFetch(okBody({ version: 3 }));

    await expect(getBackendVersion()).rejects.toThrow("unexpected response body");
  });

  it("ignores extra fields in the body", async () => {
    stubFetch(okBody({ version: "0.1.0", commit: "abc123" }));

    await expect(getBackendVersion()).resolves.toBe("0.1.0");
  });

  it("honours VITE_API_BASE_URL", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test");
    vi.resetModules();
    const fetchMock = stubFetch(okBody({ version: "0.1.0" }));

    const { getBackendVersion: getConfiguredVersion } = await import("./version");
    await getConfiguredVersion();

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/api/version");
  });
});
