import { describe, it, expect, vi, afterEach } from "vitest";
import { getVersion } from "./version";

function stubFetch(response: Partial<Response>) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns the version the backend sent, from the default base URL", async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "abc1234" }),
    });

    await expect(getVersion()).resolves.toBe("0.1.0");
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8010/api/version");
  });

  it("uses VITE_API_BASE_URL instead of the default when it is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://notes.example.test");
    vi.resetModules();
    const { getVersion: getVersionWithConfiguredBase } = await import("./version");
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({ version: "0.1.0", commit: "abc1234" }),
    });

    await getVersionWithConfiguredBase();

    expect(fetchMock).toHaveBeenCalledWith("https://notes.example.test/api/version");
  });

  it("throws when the backend answers with a non-OK status", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Server Error" });

    await expect(getVersion()).rejects.toThrow(
      "Loading the version failed: 500 Server Error",
    );
  });

  it("throws when the body has no non-empty string version", async () => {
    stubFetch({ ok: true, json: async () => ({ version: "" }) });
    await expect(getVersion()).rejects.toThrow("Unexpected version response");

    stubFetch({ ok: true, json: async () => ({ other: 1 }) });
    await expect(getVersion()).rejects.toThrow("Unexpected version response");
  });
});
